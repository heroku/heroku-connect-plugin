Heroku Connect Toolbelt Plugin
==================

# Install

    $ heroku plugins:install heroku-connect-plugin


# Help  

    heroku help connect 

# Commands

    heroku connect:auth                    - Authenticate a connection to Salesforce
    heroku connect:export                  - Export a mapping configuration JSON file
    heroku connect:import FILE             - Import a mapping configuration JSON file
    heroku connect:info                    - Display connection information 
    heroku connect:mapping:state MAPPING   - Return the state of a mapping
    heroku connect:mapping:delete MAPPING  - Delete an existing mapping
    heroku connect:mapping:reload MAPPING  - Reload a mapping's data from Salesforce
    heroku connect:pause                   - Pause a connection
    heroku connect:resume                  - Resume a connection
    heroku connect:restart                 - Restart a connection
    heroku connect:setup                   - Configure a new connection
    heroku connect:state                   - Return the state flag for a single connection

# Examples

Download an existing mapping configuration

    $ heroku connect:export
    Saved config-file: app-name-resource-name.json

# Tutorial

Make sure you have a Heroku app, with a Postgres database attached

## Add the Heroku Connect add-on to your app

    $ heroku addons:create herokuconnect

## Link the new connection (the Heroku Connect add-on instance) to your Heroku user

    $ heroku connect:info

## Now link the connection to the database, specifying the config var and schema name

    $ heroku connect:setup -d DATABASE_URL -s salesforce
    Configuring connection with
     { schema_name: 'salesforce', db_key: 'DATABASE_URL' }
    Setup complete

## Authorize the connection to access your Salesforce organization

    $ heroku connect:auth
    Auth response  https://login.salesforce.com/services/oauth2/authorize?…

## Verify that connection is now in 'IDLE' state

    $ heroku connect:info
    .. check for '(IDLE)'

## Now sync the Contact table

    $ heroku connect:mapping:create Contact --fields FirstName,LastName --mode write --with-required -a <app>

## Connect to your database to see the data

    $ heroku pg:psql
    > select * from salesforce.contact;

