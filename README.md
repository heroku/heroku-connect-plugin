# Heroku Connect CLI Plugin

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku-cli/heroku-connect-plugin.svg)](https://npmjs.org/package/@heroku-cli/heroku-connect-plugin)
[![Downloads/week](https://img.shields.io/npm/dw/@heroku-cli/heroku-connect-plugin.svg)](https://npmjs.org/package/@heroku-cli/heroku-connect-plugin)

<!-- toc -->
* [Heroku Connect CLI Plugin](#heroku-connect-cli-plugin)
<!-- tocstop -->

## Install

```shell
$ heroku plugins:install @heroku-cli/heroku-connect-plugin
Installing plugin @heroku-cli/heroku-connect-plugin... installed
```

## Help

```shell
$ heroku help connect
```

## Commands

<!-- commands -->
* [`heroku connect:db:set`](#heroku-connectdbset)
* [`heroku connect:diagnose`](#heroku-connectdiagnose)
* [`heroku connect:export`](#heroku-connectexport)
* [`heroku connect:import [FILE]`](#heroku-connectimport-file)
* [`heroku connect:info`](#heroku-connectinfo)
* [`heroku connect:manage-sf-api-version`](#heroku-connectmanage-sf-api-version)
* [`heroku connect:mapping:delete [MAPPING]`](#heroku-connectmappingdelete-mapping)
* [`heroku connect:mapping:diagnose [MAPPING]`](#heroku-connectmappingdiagnose-mapping)
* [`heroku connect:mapping:reload [MAPPING]`](#heroku-connectmappingreload-mapping)
* [`heroku connect:mapping:state [MAPPING]`](#heroku-connectmappingstate-mapping)
* [`heroku connect:mapping:write-errors NAME`](#heroku-connectmappingwrite-errors-name)
* [`heroku connect:notifications`](#heroku-connectnotifications)
* [`heroku connect:notifications:acknowledge`](#heroku-connectnotificationsacknowledge)
* [`heroku connect:pause`](#heroku-connectpause)
* [`heroku connect:recover`](#heroku-connectrecover)
* [`heroku connect:restart`](#heroku-connectrestart)
* [`heroku connect:resume`](#heroku-connectresume)
* [`heroku connect:sf:auth`](#heroku-connectsfauth)
* [`heroku connect:state`](#heroku-connectstate)
* [`heroku connect:write-errors`](#heroku-connectwrite-errors)

## `heroku connect:db:set`

Set database parameters

```
USAGE
  $ heroku connect:db:set -a <value> [--prompt] [--db <value>] [--resource <value>] [--schema <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --db=<value>        Database config var name
      --resource=<value>  specific connection resource name
      --schema=<value>    Database schema name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Set database parameters
```

_See code: [src/commands/connect/db/set.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/db/set.ts)_

## `heroku connect:diagnose`

Display diagnostic information about a connection

```
USAGE
  $ heroku connect:diagnose -a <value> [--prompt] [--resource <value>] [-v]

FLAGS
  -a, --app=<value>       (required) app to run command against
  -v, --verbose           display passed and skipped check information as well
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Display diagnostic information about a connection
```

_See code: [src/commands/connect/diagnose.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/diagnose.ts)_

## `heroku connect:export`

Export configuration from a connection

```
USAGE
  $ heroku connect:export -a <value> [--prompt] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Export configuration from a connection
```

_See code: [src/commands/connect/export.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/export.ts)_

## `heroku connect:import [FILE]`

Import configuration from an export file

```
USAGE
  $ heroku connect:import [FILE] -a <value> [--prompt] [--resource <value>]

ARGUMENTS
  [FILE]  JSON export file name

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Import configuration from an export file
```

_See code: [src/commands/connect/import.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/import.ts)_

## `heroku connect:info`

Display connection information

```
USAGE
  $ heroku connect:info -a <value> [--prompt] [-c] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
  -c, --check-for-new     check for access to any new connections
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Display connection information
```

_See code: [src/commands/connect/info.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/info.ts)_

## `heroku connect:manage-sf-api-version`

Compare mapping schemas between API versions and optionally change the version

```
USAGE
  $ heroku connect:manage-sf-api-version -a <value> --target-version <value> [--prompt] [--confirm <value>] [--json] [--resource
    <value>]

FLAGS
  -a, --app=<value>             (required) app to run command against
      --confirm=<value>         pass the app name to change the connection to the target version after showing the
                                schema differences
      --json                    print output as json
      --resource=<value>        specific connection resource name
      --target-version=<value>  (required) Salesforce API version to compare against and change to (example: 61.0)

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Compare mapping schemas between API versions and optionally change the version

  Shows a per-mapping field diff between the connection's current Salesforce API version and a target version. Pass
  --confirm to also change the connection to the target version after displaying the diff. The connection must be paused
  before changing the version.

EXAMPLES
  $ heroku connect:manage-sf-api-version --app my-app --resource herokuconnect-swiftly-54348 --target-version 61.0

  $ heroku connect:manage-sf-api-version --app my-app --resource herokuconnect-swiftly-54348 --target-version 61.0 --confirm my-app

  $ heroku connect:manage-sf-api-version --app my-app --resource herokuconnect-swiftly-54348 --target-version 61.0 --json
```

_See code: [src/commands/connect/manage-sf-api-version.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/manage-sf-api-version.ts)_

## `heroku connect:mapping:delete [MAPPING]`

Delete an existing mapping

```
USAGE
  $ heroku connect:mapping:delete [MAPPING] -a <value> [--prompt] [--confirm <value>] [--resource <value>]

ARGUMENTS
  [MAPPING]  mapping name

FLAGS
  -a, --app=<value>       (required) app to run command against
      --confirm=<value>   app name to confirm deletion
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Delete an existing mapping
```

_See code: [src/commands/connect/mapping/delete.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/mapping/delete.ts)_

## `heroku connect:mapping:diagnose [MAPPING]`

Display diagnostic information about a mapping

```
USAGE
  $ heroku connect:mapping:diagnose [MAPPING] -a <value> [--prompt] [--resource <value>] [-v]

ARGUMENTS
  [MAPPING]  mapping name

FLAGS
  -a, --app=<value>       (required) app to run command against
  -v, --verbose           display passed and skipped check information as well
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Display diagnostic information about a mapping
```

_See code: [src/commands/connect/mapping/diagnose.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/mapping/diagnose.ts)_

## `heroku connect:mapping:reload [MAPPING]`

Reload a mapping's data from Salesforce

```
USAGE
  $ heroku connect:mapping:reload [MAPPING] -a <value> [--prompt] [--resource <value>]

ARGUMENTS
  [MAPPING]  mapping name

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Reload a mapping's data from Salesforce
```

_See code: [src/commands/connect/mapping/reload.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/mapping/reload.ts)_

## `heroku connect:mapping:state [MAPPING]`

Return a mapping state

```
USAGE
  $ heroku connect:mapping:state [MAPPING] -a <value> [--prompt] [--resource <value>]

ARGUMENTS
  [MAPPING]  mapping name

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Return a mapping state
```

_See code: [src/commands/connect/mapping/state.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/mapping/state.ts)_

## `heroku connect:mapping:write-errors NAME`

Display the last 24 hours of write errors on this mapping

```
USAGE
  $ heroku connect:mapping:write-errors NAME -a <value> [--prompt] [--json] [--resource <value>]

ARGUMENTS
  NAME  Name of the mapping to retrieve errors for

FLAGS
  -a, --app=<value>       (required) app to run command against
      --json              print errors as styled JSON
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Display the last 24 hours of write errors on this mapping

EXAMPLES
  $ heroku connect:mapping:write-errors -a myapp --resource herokuconnect-twisted-123 Account
```

_See code: [src/commands/connect/mapping/write-errors.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/mapping/write-errors.ts)_

## `heroku connect:notifications`

Return the unacknowledged notifications

```
USAGE
  $ heroku connect:notifications -a <value> [--prompt] [--after <value>] [--before <value>] [--event-type <value>]
    [--resource <value>]

FLAGS
  -a, --app=<value>         (required) app to run command against
      --after=<value>       start date for notifications
      --before=<value>      end date for notifications
      --event-type=<value>  type of event to filter by
      --resource=<value>    specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Return the unacknowledged notifications
```

_See code: [src/commands/connect/notifications/index.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/notifications/index.ts)_

## `heroku connect:notifications:acknowledge`

Acknowledges notifications matching the given criteria

```
USAGE
  $ heroku connect:notifications:acknowledge -a <value> [--prompt] [--after <value>] [--before <value>] [--event-type <value>]
    [--resource <value>]

FLAGS
  -a, --app=<value>         (required) app to run command against
      --after=<value>       start date for notifications
      --before=<value>      end date for notifications
      --event-type=<value>  type of event to filter by
      --resource=<value>    specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Acknowledges notifications matching the given criteria
```

_See code: [src/commands/connect/notifications/acknowledge.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/notifications/acknowledge.ts)_

## `heroku connect:pause`

Pause a connection

```
USAGE
  $ heroku connect:pause -a <value> [--prompt] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Pause a connection
```

_See code: [src/commands/connect/pause.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/pause.ts)_

## `heroku connect:recover`

Recover a connection

```
USAGE
  $ heroku connect:recover -a <value> [--prompt] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Recover a connection

ALIASES
  $ heroku connect:restart
```

_See code: [src/commands/connect/recover.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/recover.ts)_

## `heroku connect:restart`

Recover a connection

```
USAGE
  $ heroku connect:restart -a <value> [--prompt] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Recover a connection

ALIASES
  $ heroku connect:restart
```

## `heroku connect:resume`

Resume a connection

```
USAGE
  $ heroku connect:resume -a <value> [--prompt] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Resume a connection
```

_See code: [src/commands/connect/resume.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/resume.ts)_

## `heroku connect:sf:auth`

Authorize access to Salesforce for your connection

```
USAGE
  $ heroku connect:sf:auth -a <value> [--prompt] [-c <value>] [-d <value>] [-e <value>] [--resource <value>]

FLAGS
  -a, --app=<value>          (required) app to run command against
  -c, --callback=<value>     final callback URL
  -d, --domain=<value>       specify a custom login domain (if using a "custom" environment)
  -e, --environment=<value>  "production", "sandbox", or "custom" [defaults to "production"]
      --resource=<value>     specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Authorize access to Salesforce for your connection
```

_See code: [src/commands/connect/sf/auth.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/sf/auth.ts)_

## `heroku connect:state`

Return the connection(s) state

```
USAGE
  $ heroku connect:state -a <value> [--prompt] [--json] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --json              print output as json
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Return the connection(s) state
```

_See code: [src/commands/connect/state.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/state.ts)_

## `heroku connect:write-errors`

Display the last 24 hours of write errors on this connection

```
USAGE
  $ heroku connect:write-errors -a <value> [--prompt] [--json] [--resource <value>]

FLAGS
  -a, --app=<value>       (required) app to run command against
      --json              print errors as styled JSON
      --resource=<value>  specific connection resource name

GLOBAL FLAGS
  --prompt  interactively prompt for command arguments and flags

DESCRIPTION
  Display the last 24 hours of write errors on this connection

EXAMPLES
  $ heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123
```

_See code: [src/commands/connect/write-errors.ts](https://github.com/heroku/heroku-connect-plugin/blob/v0.13.1/src/commands/connect/write-errors.ts)_
<!-- commandsstop -->

## Examples

Download an existing mapping configuration

```shell
$ heroku connect:export
Saved config-file: app-name-resource-name.json
```

## Tutorial

Make sure you have a Heroku app, with a Postgres database attached

### Add the Heroku Connect add-on to your app

```shell
$ heroku addons:create herokuconnect
```

### Link the new connection (the Heroku Connect add-on instance) to your Heroku user

```shell
$ heroku connect:info
```

### Now link the connection to the database, specifying the config var and schema name

```shell
$ heroku connect:db:set --db=DATABASE_URL --schema=salesforce
settings database parameters... done
db_key:      DATABASE_URL
schema_name: salesforce
```

If either option is not supplied, this command will ask for a value.

### Authorize the connection to access your Salesforce organization

```shell
$ heroku connect:sf:auth
Launching Salesforce for authorization. If your browser doesn't open, please copy the following URL to proceed:

https://login.salesforce.com/services/oauth2/authorize?...

This will launch your browser for an interactive authorization session.
```

### Verify that connection is now in 'IDLE' state

```shell
$ heroku connect:state
IDLE
```

### Now restore the exported configuration

This could be exported using the `connect:export` command or directly through the Heroku Connect dashboard. By editing this configuration file, you can add and edit existing mappings easily.

```shell
$ heroku connect:import app-name-resource-name.json
Upload complete
```

If you need to delete a mapping after the configuration has been imported, you can use a separate command for that:

```shell
$ heroku connect:mapping:delete Contact
```

### Connect to your database to see the data

```shell
$ heroku pg:psql
> select * from salesforce.contact;
```

## Contributing

Read the following:

- [Developing CLI Plugins](https://devcenter.heroku.com/articles/developing-cli-plugins)
- [Testing CLI Plugins](https://devcenter.heroku.com/articles/testing-cli-plugins)
- [CLI Style Guide](https://devcenter.heroku.com/articles/cli-style-guide)
