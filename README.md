@heroku-cli/heroku-connect-plugin
=================================

Heroku Connect CLI plugin


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/heroku-connect-plugin.svg)](https://npmjs.org/package/@heroku-cli/heroku-connect-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/heroku-connect-plugin.svg)](https://npmjs.org/package/@heroku-cli/heroku-connect-plugin)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Examples](#examples)
* [Tutorial](#tutorial)
<!-- tocstop -->
# Usage
```sh-session
$ heroku plugins:install @heroku-cli/heroku-connect-plugin
$ heroku connect:COMMAND
running command...
$ heroku connect --help [COMMAND]
USAGE
  $ heroku connect:COMMAND
...
```
# Commands
<!-- commands -->

<!-- commandsstop -->

# Examples

Download an existing mapping configuration

```shell
$ heroku connect:export
Saved config-file: app-name-resource-name.json
```

# Tutorial

Make sure you have a Heroku app, with a Postgres database attached

## Add the Heroku Connect add-on to your app

```shell
$ heroku addons:create herokuconnect
```

## Link the new connection (the Heroku Connect add-on instance) to your Heroku user

```shell
$ heroku connect:info
```

## Now link the connection to the database, specifying the config var and schema name

```shell
$ heroku connect:db:set --db=DATABASE_URL --schema=salesforce
settings database parameters... done
db_key:      DATABASE_URL
schema_name: salesforce
```

If either option is not supplied, this command will ask for a value.

## Authorize the connection to access your Salesforce organization

```shell
$ heroku connect:sf:auth
Launching Salesforce for authorization. If your browser doesn't open, please copy the following URL to proceed:

https://login.salesforce.com/services/oauth2/authorize?…

This will launch your browser for an interactive authorization session.
```

## Verify that connection is now in 'IDLE' state

```shell
$ heroku connect:state
IDLE
```

## Now restore the exported configuration

This could be exported using the `connect:export` command or directly through the Heroku Connect dashboard. By editing this configuration file, you can add and edit existing mappings easily.

```shell
$ heroku connect:import app-name-resource-name.json
Upload complete
```

If you need to delete a mapping after the configuration has been imported, you can use a separate command for that:

```shell
$ heroku connect:mapping:delete Contact
```

## Connect to your database to see the data

```shell
$ heroku pg:psql
> select * from salesforce.contact;
```

## Contributing

Read the following:

- [Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-cli-plugins)
- [CLI Style Guide](https://devcenter.heroku.com/articles/cli-style-guide)
