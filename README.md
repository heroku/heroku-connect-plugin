Heroku Connect Toolbelt Plugin
==================

# Install

    $ heroku plugins:install heroku-connect-plugin


# Help  

    heroku help connect 

# Commands

    heroku connect:auth                   - Authenticate a connection to Salesforce
    heroku connect:preauth                - Store a Salesforce authentication for future use
    heroku connect:export                 - Export a mapping configuration JSON file
    heroku connect:import                 - Import a mapping configuration JSON file
    heroku connect:info                   - Display connection information 
    heroku connect:mapping:state MAPPING  - Returns the state of a mapping
    heroku connect:setup                  - Configure a new connection
    heroku connect:state                  - Return the state flag for a single connection
    heroku connect:pause                  - Pause a connection
    heroku connect:resume                 - Resume a connection
    heroku connect:restart                - Restart a connection

# Examples

Download the mapping configuration

    heroku connect:export

# Tutorial

Create an authorization into your Salesforce org. Note the result token.

    heroku connect:preauth

    Token: xxx


Make sure you have a Heroku app, with a Postgres database attached

Add the Heroku Connect add-on to your app

    $ heroku addons:create herokuconnect -a <app>

Link the new connection (the Heroku Connect add-on instance) to your Heroku user

    $ heroku connect:info -a <app>

Now link the connection to the database and the Salesforce Org, using the preauth token

    $ heroku connect:setup -d DATABASE_URL -s salesforce -t <token from step 1> -a <app>

Verify that connection is now in 'IDLE' state

    $ heroku connect:info -a <app>
    .. check for '(IDLE)'

Now sync the Contact table

    $ heroku connect:mapping:create Contact --fields FirstName,LastName --mode write --with-required -a <app>

Connect to your database to see the data

    $ heroku pg:psql -a <app>
    > select * from salesforce.contact;

