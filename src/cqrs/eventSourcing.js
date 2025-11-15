/**
 * Event Sourcing & CQRS Implementation
 * Enables complete audit trail and time-travel debugging
 */

const { EventEmitter } = require('events');
const logger = require('../config/logger');

// Event Store
class EventStore {
  constructor() {
    this.events = [];
    this.snapshots = new Map();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Append an event to the store
   */
  async append(event) {
    try {
      const { Event } = require('../models');

      // Validate event
      if (!event.aggregateId || !event.type) {
        throw new Error('Invalid event: aggregateId and type are required');
      }

      // Add metadata
      const enrichedEvent = {
        ...event,
        version: await this.getNextVersion(event.aggregateId),
        timestamp: new Date(),
        id: this.generateEventId()
      };

      // Store in database
      await Event.create({
        id: enrichedEvent.id,
        aggregateId: enrichedEvent.aggregateId,
        aggregateType: enrichedEvent.aggregateType,
        type: enrichedEvent.type,
        data: JSON.stringify(enrichedEvent.data),
        metadata: JSON.stringify(enrichedEvent.metadata || {}),
        version: enrichedEvent.version,
        timestamp: enrichedEvent.timestamp
      });

      // Store in memory for quick access
      this.events.push(enrichedEvent);

      // Emit event for subscribers
      this.eventEmitter.emit(enrichedEvent.type, enrichedEvent);
      this.eventEmitter.emit('*', enrichedEvent);

      logger.info(`Event appended: ${enrichedEvent.type}`, {
        aggregateId: enrichedEvent.aggregateId,
        version: enrichedEvent.version
      });

      return enrichedEvent;
    } catch (error) {
      logger.error('Failed to append event:', error);
      throw error;
    }
  }

  /**
   * Get all events for an aggregate
   */
  async getEvents(aggregateId, fromVersion = 0) {
    try {
      const { Event } = require('../models');
      const { Op } = require('sequelize');

      const events = await Event.findAll({
        where: {
          aggregateId,
          version: { [Op.gte]: fromVersion }
        },
        order: [['version', 'ASC']]
      });

      return events.map(e => ({
        id: e.id,
        aggregateId: e.aggregateId,
        aggregateType: e.aggregateType,
        type: e.type,
        data: JSON.parse(e.data),
        metadata: JSON.parse(e.metadata),
        version: e.version,
        timestamp: e.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get events:', error);
      throw error;
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(type, limit = 100) {
    try {
      const { Event } = require('../models');

      const events = await Event.findAll({
        where: { type },
        order: [['timestamp', 'DESC']],
        limit
      });

      return events.map(e => ({
        id: e.id,
        aggregateId: e.aggregateId,
        type: e.type,
        data: JSON.parse(e.data),
        timestamp: e.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get events by type:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType, handler) {
    this.eventEmitter.on(eventType, handler);
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(handler) {
    this.eventEmitter.on('*', handler);
  }

  /**
   * Create snapshot
   */
  async createSnapshot(aggregateId, state, version) {
    try {
      const snapshot = {
        aggregateId,
        state,
        version,
        timestamp: new Date()
      };

      this.snapshots.set(aggregateId, snapshot);

      const { Snapshot } = require('../models');
      await Snapshot.upsert({
        aggregateId,
        state: JSON.stringify(state),
        version,
        timestamp: snapshot.timestamp
      });

      logger.info(`Snapshot created for aggregate ${aggregateId} at version ${version}`);
    } catch (error) {
      logger.error('Failed to create snapshot:', error);
    }
  }

  /**
   * Get latest snapshot
   */
  async getSnapshot(aggregateId) {
    try {
      // Check memory first
      if (this.snapshots.has(aggregateId)) {
        return this.snapshots.get(aggregateId);
      }

      // Load from database
      const { Snapshot } = require('../models');
      const snapshot = await Snapshot.findOne({
        where: { aggregateId },
        order: [['version', 'DESC']]
      });

      if (snapshot) {
        const snapshotData = {
          aggregateId: snapshot.aggregateId,
          state: JSON.parse(snapshot.state),
          version: snapshot.version,
          timestamp: snapshot.timestamp
        };

        this.snapshots.set(aggregateId, snapshotData);
        return snapshotData;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get snapshot:', error);
      return null;
    }
  }

  /**
   * Get next version number for aggregate
   */
  async getNextVersion(aggregateId) {
    try {
      const { Event } = require('../models');
      const lastEvent = await Event.findOne({
        where: { aggregateId },
        order: [['version', 'DESC']]
      });

      return lastEvent ? lastEvent.version + 1 : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Replay events to rebuild state
   */
  async replayEvents(aggregateId, reducer) {
    // Get snapshot
    const snapshot = await this.getSnapshot(aggregateId);
    let state = snapshot ? snapshot.state : {};
    const fromVersion = snapshot ? snapshot.version + 1 : 0;

    // Get events since snapshot
    const events = await this.getEvents(aggregateId, fromVersion);

    // Apply events to state
    for (const event of events) {
      state = reducer(state, event);
    }

    return state;
  }
}

// Aggregate Base Class
class Aggregate {
  constructor(id) {
    this.id = id;
    this.version = 0;
    this.uncommittedEvents = [];
  }

  /**
   * Apply event to aggregate
   */
  apply(event) {
    // Apply event to state
    this.when(event);

    // Track uncommitted event
    this.uncommittedEvents.push(event);
    this.version++;
  }

  /**
   * Override in subclass to handle events
   */
  when(event) {
    throw new Error('when() must be implemented by subclass');
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents() {
    return this.uncommittedEvents;
  }

  /**
   * Mark events as committed
   */
  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }

  /**
   * Load from history
   */
  loadFromHistory(events) {
    for (const event of events) {
      this.when(event);
      this.version++;
    }
  }
}

// Command Handler
class CommandHandler {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Handle a command
   */
  async handle(command) {
    try {
      // Validate command
      if (!command.type || !command.aggregateId) {
        throw new Error('Invalid command');
      }

      // Load aggregate
      const aggregate = await this.loadAggregate(command.aggregateId, command.aggregateType);

      // Execute command
      const events = await this.execute(aggregate, command);

      // Save events
      for (const event of events) {
        await this.eventStore.append({
          ...event,
          aggregateId: command.aggregateId,
          aggregateType: command.aggregateType
        });
      }

      // Mark as committed
      aggregate.markEventsAsCommitted();

      // Create snapshot every 10 events
      if (aggregate.version % 10 === 0) {
        await this.eventStore.createSnapshot(
          command.aggregateId,
          aggregate.getState(),
          aggregate.version
        );
      }

      return { success: true, version: aggregate.version };
    } catch (error) {
      logger.error('Command handling failed:', error);
      throw error;
    }
  }

  /**
   * Load aggregate from event store
   */
  async loadAggregate(aggregateId, aggregateType) {
    // Get snapshot
    const snapshot = await this.eventStore.getSnapshot(aggregateId);

    // Create aggregate
    const AggregateClass = this.getAggregateClass(aggregateType);
    const aggregate = new AggregateClass(aggregateId);

    if (snapshot) {
      aggregate.loadFromSnapshot(snapshot);
    }

    // Load events since snapshot
    const fromVersion = snapshot ? snapshot.version + 1 : 0;
    const events = await this.eventStore.getEvents(aggregateId, fromVersion);
    aggregate.loadFromHistory(events);

    return aggregate;
  }

  /**
   * Get aggregate class by type
   */
  getAggregateClass(type) {
    // Override in subclass
    throw new Error('getAggregateClass() must be implemented');
  }

  /**
   * Execute command
   */
  async execute(aggregate, command) {
    // Override in subclass
    throw new Error('execute() must be implemented');
  }
}

// Projection (Read Model)
class Projection {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.state = {};
  }

  /**
   * Subscribe to events
   */
  start() {
    // Subscribe to relevant events
    this.getEventTypes().forEach(eventType => {
      this.eventStore.subscribe(eventType, (event) => {
        this.handle(event);
      });
    });
  }

  /**
   * Get event types to subscribe to
   */
  getEventTypes() {
    throw new Error('getEventTypes() must be implemented');
  }

  /**
   * Handle event
   */
  handle(event) {
    throw new Error('handle() must be implemented');
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
}

// Singleton instances
const eventStore = new EventStore();

module.exports = {
  EventStore,
  Aggregate,
  CommandHandler,
  Projection,
  eventStore
};
