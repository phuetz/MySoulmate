#!/usr/bin/env node

/**
 * MySoulmate CLI
 * Command-line tool for developers and administrators
 */

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const program = new Command();

program
  .name('mysoulmate')
  .description('MySoulmate CLI - Development and Administration Tool')
  .version('2.1.0');

// ==================== Database Commands ====================

const db = program.command('db').description('Database management commands');

db.command('migrate')
  .description('Run database migrations')
  .action(async () => {
    const spinner = ora('Running database migrations...').start();
    try {
      await execPromise('npx sequelize-cli db:migrate');
      spinner.succeed(chalk.green('Migrations completed successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Migration failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

db.command('rollback')
  .description('Rollback last database migration')
  .action(async () => {
    const spinner = ora('Rolling back last migration...').start();
    try {
      await execPromise('npx sequelize-cli db:migrate:undo');
      spinner.succeed(chalk.green('Rollback completed successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Rollback failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

db.command('seed')
  .description('Seed database with sample data')
  .action(async () => {
    const spinner = ora('Seeding database...').start();
    try {
      await execPromise('npx sequelize-cli db:seed:all');
      spinner.succeed(chalk.green('Database seeded successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Seeding failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

db.command('reset')
  .description('Reset database (undo all migrations and re-run)')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('This will delete all data. Are you sure?'),
        default: false
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('Cancelled'));
      return;
    }

    const spinner = ora('Resetting database...').start();
    try {
      await execPromise('npm run db:reset');
      spinner.succeed(chalk.green('Database reset successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Reset failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

// ==================== Environment Commands ====================

program
  .command('env:validate')
  .description('Validate environment variables')
  .action(async () => {
    const spinner = ora('Validating environment...').start();
    try {
      await execPromise('node scripts/validateEnv.js');
      spinner.succeed(chalk.green('Environment validation passed'));
    } catch (error) {
      spinner.fail(chalk.red('Environment validation failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

program
  .command('env:generate')
  .description('Generate .env file from .env.example')
  .action(async () => {
    try {
      if (fs.existsSync('.env')) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: chalk.yellow('.env file already exists. Overwrite?'),
            default: false
          }
        ]);

        if (!overwrite) {
          console.log(chalk.gray('Cancelled'));
          return;
        }
      }

      fs.copyFileSync('.env.example', '.env');
      console.log(chalk.green('✓ .env file generated'));
      console.log(chalk.yellow('⚠ Remember to update the values in .env'));
    } catch (error) {
      console.error(chalk.red('Failed to generate .env:'), error.message);
      process.exit(1);
    }
  });

// ==================== Docker Commands ====================

const docker = program.command('docker').description('Docker management commands');

docker.command('up')
  .description('Start Docker containers')
  .action(async () => {
    const spinner = ora('Starting Docker containers...').start();
    try {
      await execPromise('docker-compose up -d');
      spinner.succeed(chalk.green('Containers started successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to start containers'));
      console.error(error.message);
      process.exit(1);
    }
  });

docker.command('down')
  .description('Stop Docker containers')
  .action(async () => {
    const spinner = ora('Stopping Docker containers...').start();
    try {
      await execPromise('docker-compose down');
      spinner.succeed(chalk.green('Containers stopped successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to stop containers'));
      console.error(error.message);
      process.exit(1);
    }
  });

docker.command('logs')
  .description('View Docker container logs')
  .action(async () => {
    try {
      const { stdout } = await execPromise('docker-compose logs --tail=100');
      console.log(stdout);
    } catch (error) {
      console.error(chalk.red('Failed to fetch logs:'), error.message);
      process.exit(1);
    }
  });

// ==================== Test Commands ====================

const test = program.command('test').description('Testing commands');

test.command('all')
  .description('Run all tests')
  .action(async () => {
    const spinner = ora('Running tests...').start();
    try {
      await execPromise('npm test');
      spinner.succeed(chalk.green('All tests passed'));
    } catch (error) {
      spinner.fail(chalk.red('Tests failed'));
      console.error(error.stdout || error.message);
      process.exit(1);
    }
  });

test.command('coverage')
  .description('Run tests with coverage')
  .action(async () => {
    const spinner = ora('Running tests with coverage...').start();
    try {
      await execPromise('npm run test:coverage');
      spinner.succeed(chalk.green('Coverage report generated'));
    } catch (error) {
      spinner.fail(chalk.red('Tests failed'));
      console.error(error.stdout || error.message);
      process.exit(1);
    }
  });

// ==================== Deploy Commands ====================

const deploy = program.command('deploy').description('Deployment commands');

deploy.command('staging')
  .description('Deploy to staging environment')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Deploy to staging?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.gray('Cancelled'));
      return;
    }

    const spinner = ora('Deploying to staging...').start();
    try {
      await execPromise('npm run deploy:staging');
      spinner.succeed(chalk.green('Deployed to staging successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Deployment failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

deploy.command('production')
  .description('Deploy to production environment')
  .action(async () => {
    console.log(chalk.yellow('⚠️  Production Deployment'));
    console.log('');

    const { confirm1, confirm2 } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm1',
        message: 'Have you run all tests?',
        default: false
      },
      {
        type: 'confirm',
        name: 'confirm2',
        message: chalk.red('Are you absolutely sure you want to deploy to production?'),
        default: false
      }
    ]);

    if (!confirm1 || !confirm2) {
      console.log(chalk.gray('Cancelled'));
      return;
    }

    const spinner = ora('Deploying to production...').start();
    try {
      await execPromise('npm run deploy:production');
      spinner.succeed(chalk.green('Deployed to production successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Deployment failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

// ==================== Health Commands ====================

program
  .command('health')
  .description('Check application health')
  .option('-d, --detailed', 'Show detailed health information')
  .action(async (options) => {
    const spinner = ora('Checking health...').start();
    try {
      const endpoint = options.detailed ? '/health/detailed' : '/health';
      const { stdout } = await execPromise(`curl -s http://localhost:3000${endpoint}`);
      spinner.stop();

      const health = JSON.parse(stdout);
      if (health.status === 'healthy') {
        console.log(chalk.green('✓ Application is healthy'));
      } else {
        console.log(chalk.yellow('⚠ Application is degraded'));
      }

      if (options.detailed) {
        console.log(JSON.stringify(health, null, 2));
      }
    } catch (error) {
      spinner.fail(chalk.red('Health check failed'));
      console.error(error.message);
      process.exit(1);
    }
  });

// ==================== Generate Commands ====================

const generate = program.command('generate').alias('g').description('Generate code templates');

generate.command('model <name>')
  .description('Generate a new Sequelize model')
  .action((name) => {
    const modelTemplate = `/**
 * ${name} Model
 */

module.exports = (sequelize, DataTypes) => {
  const ${name} = sequelize.define('${name}', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Add your fields here
  }, {
    tableName: '${name.toLowerCase()}s',
    timestamps: true
  });

  ${name}.associate = function(models) {
    // Define associations here
  };

  return ${name};
};
`;

    const filePath = path.join(__dirname, '..', 'src', 'models', `${name}.js`);
    fs.writeFileSync(filePath, modelTemplate);
    console.log(chalk.green(`✓ Model created: ${filePath}`));
  });

generate.command('route <name>')
  .description('Generate a new route file')
  .action((name) => {
    const routeTemplate = `/**
 * ${name} Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/${name.toLowerCase()}
 * @desc    Get all ${name.toLowerCase()}
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // Implementation here
    res.json({ message: '${name} endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
`;

    const filePath = path.join(__dirname, '..', 'src', 'routes', `${name.toLowerCase()}.js`);
    fs.writeFileSync(filePath, routeTemplate);
    console.log(chalk.green(`✓ Route created: ${filePath}`));
  });

// ==================== Utility Commands ====================

program
  .command('logs')
  .description('View application logs')
  .option('-e, --error', 'Show error logs only')
  .option('-f, --follow', 'Follow log output')
  .action((options) => {
    const logFile = options.error ? 'logs/error.log' : 'logs/combined.log';
    const command = options.follow ? `tail -f ${logFile}` : `tail -100 ${logFile}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red('Failed to read logs:'), error.message);
        return;
      }
      console.log(stdout);
    });
  });

program
  .command('clean')
  .description('Clean temporary files and caches')
  .action(async () => {
    const spinner = ora('Cleaning...').start();
    try {
      // Remove node_modules/.cache
      if (fs.existsSync('node_modules/.cache')) {
        fs.rmSync('node_modules/.cache', { recursive: true });
      }

      // Remove logs
      if (fs.existsSync('logs')) {
        fs.rmSync('logs', { recursive: true });
        fs.mkdirSync('logs');
      }

      spinner.succeed(chalk.green('Cleaned successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Cleaning failed'));
      console.error(error.message);
    }
  });

program
  .command('info')
  .description('Show project information')
  .action(() => {
    const packageJson = require('../package.json');

    console.log('');
    console.log(chalk.bold.cyan('MySoulmate Project Information'));
    console.log('');
    console.log(`${chalk.gray('Name:')}        ${packageJson.name}`);
    console.log(`${chalk.gray('Version:')}     ${packageJson.version}`);
    console.log(`${chalk.gray('Description:')} ${packageJson.description}`);
    console.log(`${chalk.gray('Node:')}        ${process.version}`);
    console.log(`${chalk.gray('Platform:')}    ${process.platform}`);
    console.log('');
  });

program.parse(process.argv);
