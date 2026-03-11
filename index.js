import connectInfo from './commands/connect/info.js'
import connectState from './commands/connect/state.js'
import connectImport from './commands/connect/import.js'
import connectExport from './commands/connect/export.js'
import connectPause from './commands/connect/pause.js'
import connectResume from './commands/connect/resume.js'
import connectRecover from './commands/connect/recover.js'
import connectSfAuth from './commands/connect/sf-auth.js'
import connectDbSet from './commands/connect/db-set.js'
import connectDiagnose from './commands/connect/diagnose.js'
import connectMappingState from './commands/connect/mapping-state.js'
import connectMappingDelete from './commands/connect/mapping-delete.js'
import connectMappingReload from './commands/connect/mapping-reload.js'
import connectMappingDiagnose from './commands/connect/mapping-diagnose.js'
import connectMappingWriteErrors from './commands/connect/mapping-write-errors.js'
import connectNotifications from './commands/connect/notifications.js'
import connectNotificationsAcknowledge from './commands/connect/notifications-acknowledge.js'
import connectWriteErrors from './commands/connect/write-errors.js'

import eventsInfo from './commands/connect-events/info.js'
import eventsState from './commands/connect-events/state.js'
import eventsPause from './commands/connect-events/pause.js'
import eventsResume from './commands/connect-events/resume.js'
import eventsRecover from './commands/connect-events/recover.js'
import eventsSfAuth from './commands/connect-events/sf-auth.js'
import eventsDbSet from './commands/connect-events/db-set.js'
import eventsStreamState from './commands/connect-events/stream-state.js'
import eventsStreamDelete from './commands/connect-events/stream-delete.js'
import eventsStreamCreate from './commands/connect-events/stream-create.js'

export const topics = [
  {
    name: 'connect',
    description: 'manage connections for Heroku Connect'
  },
  {
    name: 'connect:mapping',
    description: 'manage mappings on a Heroku Connect addon'
  },
  {
    name: 'connect:notifications',
    description: 'manage notifications on a Heroku Connect addon'
  },
  {
    name: 'connect-events',
    description: 'manage connections for Heroku Connect Events Pilot'
  },
  {
    name: 'connect-events:stream',
    description: 'manage mappings on a Heroku Connect Events Pilot addon'
  }
]

export const commands = [
  connectInfo,
  connectState,
  connectImport,
  connectExport,
  connectPause,
  connectResume,
  connectRecover,
  connectSfAuth,
  connectDbSet,
  connectDiagnose,
  connectMappingState,
  connectMappingDelete,
  connectMappingReload,
  connectMappingDiagnose,
  connectMappingWriteErrors,
  connectNotifications,
  connectNotificationsAcknowledge,
  connectWriteErrors,

  // Connect Events
  eventsInfo,
  eventsState,
  eventsPause,
  eventsResume,
  eventsRecover,
  eventsSfAuth,
  eventsDbSet,
  eventsStreamState,
  eventsStreamDelete,
  eventsStreamCreate
]
