/**
 * Script pour générer la documentation Swagger en fichier statique
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const swaggerSpec = require('./swagger');
const logger = require('./logger');

// Générer la documentation Swagger en JSON
const generateSwaggerDocs = () => {
  try {
    // Créer le répertoire docs s'il n'existe pas
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }

    // Écrire le fichier swagger.json
    fs.writeFileSync(
      path.join(docsDir, 'swagger.json'),
      JSON.stringify(swaggerSpec, null, 2)
    );

    // Générer un fichier HTML pour accéder à la documentation
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation API RESTful</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    #swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: './swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout'
      });
    };
  </script>
</body>
</html>
    `;

    fs.writeFileSync(path.join(docsDir, 'index.html'), html);

    logger.info('Documentation Swagger générée avec succès dans le répertoire "docs"');
    process.exit(0);
  } catch (error) {
    logger.error('Erreur lors de la génération de la documentation Swagger:', error);
    process.exit(1);
  }
};

generateSwaggerDocs();