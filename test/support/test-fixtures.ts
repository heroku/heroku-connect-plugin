import {randomUUID} from 'crypto'
import {
  ConnectionDetails, RequestAppAccessResponse, SearchConnectionsResponse, WriteErrorsResponse,
} from '../../src/lib/types'

export const connectionId = randomUUID()
export const appId = randomUUID()
export const addonId = randomUUID()
export const mappingId = randomUUID()
export const regionalInstanceDomain = 'connect-instance-region.heroku.com'

export const connectionDetailsResponse: ConnectionDetails = {
  id: connectionId,
  _id: 654321,
  name: 'test-connection',
  addon_id: addonId,
  app_name: 'my-app',
  team_name: null,
  enterprise_account_name: null,
  app_id: appId,
  schema_name: 'salesforce',
  db_key: 'DATABASE_URL',
  database: {
    host: 'my-host',
    database: 'my-database',
    port: 5432,
  },
  organization_id: 'org-id',
  state: 'IDLE',
  mappings_summary_state: 'OK',
  detail_url: `/api/v3/connections/${connectionId}`,
  tags: [],
  sf_info: {
    username: 'user@example.com',
    organization_id: 'org-id',
    environment: 'production',
    domain: 'https://login.salesforce.com',
    api_version: '64.0',
  },
  created_at: '2025-07-15T20:52:20.121851Z',
  auth_updated: '2025-07-16T18:04:52.271945Z',
  plan: 'demo',
  free_edition: true,
  dogwood: false,
  user_info: {
    id: 'https://login.salesforce.com/id/org-id/user-id',
    asserted_user: true,
    user_id: 'user-id',
    organization_id: 'org-id',
    username: 'user@example.com',
    nick_name: 'User1234567890',
    display_name: 'Example User',
    email: 'user@example.com',
    email_verified: true,
    first_name: 'Example',
    last_name: 'User',
    timezone: 'America/New_York',
    photos: {
      picture: 'https://example.com/profilephoto/005/F',
      thumbnail: 'https://example.com/profilephoto/005/T',
    },
    addr_street: null,
    addr_city: null,
    addr_state: null,
    addr_country: 'United States',
    addr_zip: null,
    mobile_phone: null,
    mobile_phone_verified: false,
    is_lightning_login_user: false,
    status: {
      created_date: null,
      body: null,
    },
    urls: {
      enterprise:
        'https://org-id.my.salesforce.com/services/Soap/c/{version}/some-id',
      metadata:
        'https://org-id.my.salesforce.com/services/Soap/m/{version}/some-id',
      partner:
        'https://org-id.my.salesforce.com/services/Soap/u/64.0/some-id',
      rest: 'https://org-id.my.salesforce.com/services/data/v{version}/',
      sobjects:
        'https://org-id.my.salesforce.com/services/data/v{version}/sobjects/',
      search:
        'https://org-id.my.salesforce.com/services/data/v{version}/search/',
      query:
        'https://org-id.my.salesforce.com/services/data/v{version}/query/',
      recent:
        'https://org-id.my.salesforce.com/services/data/v{version}/recent/',
      tooling_soap:
        'https://org-id.my.salesforce.com/services/Soap/T/{version}/some-id',
      tooling_rest:
        'https://org-id.my.salesforce.com/services/data/v{version}/tooling/',
      profile: 'https://org-id.my.salesforce.com/profile-id',
      feeds:
        'https://org-id.my.salesforce.com/services/data/v{version}/chatter/feeds',
      groups:
        'https://org-id.my.salesforce.com/services/data/v{version}/chatter/groups',
      users:
        'https://org-id.my.salesforce.com/services/data/v{version}/chatter/users',
      feed_items:
        'https://org-id.my.salesforce.com/services/data/v{version}/chatter/feed-items',
      feed_elements:
        'https://org-id.my.salesforce.com/services/data/v{version}/chatter/feed-elements',
      custom_domain: 'https://org-id.my.salesforce.com',
    },
    active: true,
    user_type: 'STANDARD',
    language: 'en_US',
    locale: 'en_US',
    utcOffset: 0,
    last_modified_date: '2025-07-16T17:49:36Z',
    profile_perms: {
      type: 'Profile',
      Id: 'profile-id',
      PermissionsModifyAllData: 'true',
      PermissionsViewAllData: 'true',
      PermissionsViewAllUsers: 'true',
    },
  },
  metrics: {
    last_write_activity_time: '2025-07-16T19:22:36.983896Z',
  },
  logplex_log_enabled: false,
  deletable: false,
  resource_name: 'herokuconnect-angular-12345',
  large_query_threshold: 10000,
  bulk_page_size: 150000,
  features: {
    cdc_for_accelerated_polling: false,
    disable_bulk_writes: false,
    drift_max_batches_in_parallel_override: false,
    early_sf_api_access: false,
    force_picklist_255: false,
    get_deleted_latest_date_check: false,
    increased_query_cursor_limit: false,
    log_memory_usage: false,
    mtls_shield_connection: false,
    poll_db_no_merge: true,
    poll_external_ids: false,
    rest_count_only: false,
    retry_failed_create_soap_call: false,
    retry_get_query_batch_result_ids: true,
    set_odata_extra_float_digits_to_0: false,
    sync_repair_unlimited_query_all: false,
    temp_tables_in_transactions: false,
    testing_flag_only: false,
    ucs_basic_collation_index: true,
    use_assignment_rules: false,
    verbose_sfnotifier_logging: false,
  },
  internal_name: 'my-app',
  notifications_url:
    `/api/v3/connections/${connectionId}/notifications`,
  odata: null,
  soap_batch_size: 200,
  sf_instance: null,
  sf_region: null,
  mappings: [
    {
      id: mappingId,
      _id: 12345678,
      object_name: 'Account',
      state: 'DATA_SYNCED',
      config: {
        access: 'read_only',
        sf_notify_enabled: false,
        sf_polling_seconds: 600,
        sf_max_daily_api_calls: 30000,
        fields: {
          CreatedDate: {},
          Id: {},
          IsDeleted: {},
          Name: {},
          SystemModstamp: {},
        },
        indexes: {
          Id: {
            unique: true,
          },
          SystemModstamp: {
            unique: false,
          },
        },
        revision: 1089201,
        applied_at: '2025-07-16T19:21:58.933923Z',
      },
      detail_url: `/api/v3/mappings/${mappingId}`,
      errors_url:
        `/api/v3/mappings/${mappingId}/errors`,
      schema_url:
        `https://${regionalInstanceDomain}/api/v3/connections/${connectionId}/schemas/Account`,
      created_at: '2025-07-16T19:21:56.317415Z',
      updated_at: '2025-07-16T19:21:56.317427Z',
      connection: {
        id: connectionId,
      },
      sf_notify_enabled: false,
      sf_polling_seconds: 600,
      access: 'read_only',
      counts: {
        db: 1000000,
        sf: 1000000,
        pending: 0,
        errors: 0,
      },
      actively_writing: false,
      state_description: 'OK',
      sync_flags: {},
      times: {
        sf_poll: '2025-07-16 20:12:43.734321+00:00',
        sf_write: null,
        db_poll: null,
        db_write: '2025-07-16 19:22:06.661604+00:00',
      },
      has_hc_columns: true,
      db_count_date: '2025-07-16T19:22:08.288347Z',
      salesforce_count_date: '2025-07-16T19:22:08.040595Z',
      is_polling: false,
      upsert_field: null,
    },
  ],
}

export const emptyConnectionResponse: SearchConnectionsResponse = {
  results: [],
  regions: {},
  cells: {},
  next: null,
  previous: null,
  count: 0,
}

export const singleConnectionResponse: SearchConnectionsResponse = {
  results: [
    {
      id: connectionId,
      resource_name: 'herokuconnect-angular-12345',
      display_name: 'my-app',
      addon_type: 'Sync',
      app_name: 'my-app',
      app_id: appId,
      region: 'us',
      region_url: `https://${regionalInstanceDomain}`,
      region_flag: 'united-states',
      region_label: 'Region (US)',
      cell_label: 'Region Instance (US)',
      cell: 'region-instance',
      detail_url: `https://${regionalInstanceDomain}/api/v3/connections/${connectionId}`,
    },
  ],
  regions: {
    us: {
      flag: 'united-states',
      label: 'Region (US)',
    },
  },
  cells: {
    'region-instance': {
      url: `https://${regionalInstanceDomain}`,
      flag: 'united-states',
      label: 'Region Instance (US)',
    },
  },
  next: null,
  previous: null,
  count: 1,
}

export const singleConnectionAppAccessResponse: RequestAppAccessResponse = {
  user: {
    id: 'user-id',
    email: 'user@example.com',
  },
  connections: [
    {
      id: connectionId,
      resource_name: 'herokuconnect-angular-12345',
      display_name: 'my-app',
      addon_type: 'Sync',
      app_name: 'my-app',
      app_id: appId,
      region: 'us',
      region_url: `https://${regionalInstanceDomain}`,
      region_flag: 'united-states',
      region_label: 'Region (US)',
      cell_label: 'Region Instance (US)',
      cell: 'region-instance',
      detail_url: `https://${regionalInstanceDomain}/api/v3/connections/${connectionId}`,
    },
  ],
  regions: {
    us: {
      flag: 'united-states',
      label: 'Region (US)',
    },
  },
  cells: {
    'region-instance': {
      url: `https://${regionalInstanceDomain}`,
      flag: 'united-states',
      label: 'Region Instance (US)',
    },
  },
}

export const emptyWriteErrorsResponse: WriteErrorsResponse = {
  count: 0,
  results: [],
}

export const connectionWriteErrorsResponse: WriteErrorsResponse = {
  count: 2,
  results: [
    {
      id: 'error-id',
      table_name: 'Account',
      record_id: 'record-id',
      message: 'Error message',
      created_at: '2025-07-16T19:22:08.288347Z',
    },
    {
      id: 'error-id-2',
      table_name: 'Contact',
      record_id: 'record-id-2',
      message: 'Error message 2',
      created_at: '2025-07-16T19:22:08.288347Z',
    },
  ],
}

export const mappingWriteErrorsResponse: WriteErrorsResponse = {
  count: 1,
  results: [
    {
      id: 'error-id',
      table_name: 'Account',
      record_id: 'record-id',
      message: 'Error message',
      created_at: '2025-07-16T19:22:08.288347Z',
    },
  ],
}
