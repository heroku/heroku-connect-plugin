Heroku Connect Toolbelt Plugin
==================

# Install

    $ heroku plugins:install heroku-connect-plugin


# Help  

    heroku help connect 

# Commands

    heroku connect:auth              - Authenticate a connection to Salesforce
    heroku connect:preauth           - Store a Salesforce authentication for future use
    heroku connect:export            - Export a mapping configuration json file
    heroku connect:import            - Import a mapping configuration json file
    heroku connect:mapping MAPPING   - Returns a status JSON doc for a single mapping
    heroku connect:setup             - configure a new connection
    heroku connect:state             - Return the state flag for a single connection
    heroku connect:status            - Print connection status

# Examples

Create a new mapping

    heroku connect:create-mapping Contact --fields FirstName,Email --with-required

Delete a mapping

    heroku connect:delete-mapping Account

Download the mapping configuration

    heroku connect:export

# Tutorial

1. Create an authorization into your Salesforce org. Note the result token.

    $ heroku connect:preauth
    Token: xxx

2. Make sure you have a Heroku app, with a Postgres database attached

3. Add the Heroku Connect addon to your app

    $ heroku addons:create herokuconnect -a <app>

3. Link the new connection to your Heroku user

    $ heroku connect:status -a <app>

4. Now link the connection to the database and the Salesforce Org, using the preauth token

    $ heroku connect:setup -d DATABASE_URL -s salesforce -t <token from step 1> -a <app>

5. Verify that connection is now in 'IDLE' state

    $ heroku connect:status -a <app>
    .. check for '(IDLE)'

6. Now sync the Contact table

    $ heroku connect:create-mapping Contact --fields FirstName,LastName --with-required -a <app>

7. Connect to your database to see the data

    $ heroku pg:psql -a <app>
    > select * from salesforce.contact;



