export const ADDON_TYPE_SYNC = 1 as const
export const ADDON_TYPE_EVENTS = 2 as const

export type AddonType = typeof ADDON_TYPE_SYNC | typeof ADDON_TYPE_EVENTS

export interface MappingConfig {
  access: string
  sf_notify_enabled: boolean
  sf_polling_seconds: number
  sf_max_daily_api_calls: number
  fields: Record<string, Record<string, unknown>>
  indexes: Record<string, Record<string, unknown>>
  revision: number
  applied_at: string
}

export interface Mapping {
  id: string
  _id: number
  object_name: string
  state: string
  config: MappingConfig
  detail_url: string
  errors_url: string
  schema_url: string
  created_at: string
  updated_at: string
  connection: {
    id: string
  },
  sf_notify_enabled: boolean
  sf_polling_seconds: number
  access: string
  counts: {
    db: number
    sf: number
    pending: number
    errors: number
  }
  actively_writing: boolean
  state_description: string
  sync_flags: Record<string, unknown>
  times: {
    sf_poll: string | null
    sf_write: string | null
    db_poll: string | null
    db_write: string | null
  }
  has_hc_columns: boolean
  db_count_date: string | null
  salesforce_count_date: string | null
  is_polling: boolean
  upsert_field: string | null
}

export interface Stream {
  object_name: string
}

// TODO: This needs further refinement based on the actual response from the API
export interface WriteError extends Record<string, unknown> {
  id: string
  table_name: string
  record_id: string
  message: string
  created_at: string
}

// TODO: This needs further refinement based on the actual response from the API
export interface WriteErrorsResponse {
  count: number
  results: WriteError[]
}

export interface Connection {
  addon_type: string
  app_id: string
  app_name: string
  cell: string
  cell_label: string
  detail_url: string
  display_name: string | null
  id: string
  region: string
  region_flag: string
  region_label: string
  region_url: string
  resource_name: string
}

export interface RegionInfo {
  flag: string
  label: string
}

export interface CellInfo {
  url: string
  flag: string
  label: string
}

export interface SearchConnectionsResponse {
  results: Connection[]
  regions: Record<string, RegionInfo>
  cells: Record<string, CellInfo>
  next: string | null
  previous: string | null
  count: number
}

export interface RequestAppAccessResponse {
  user: {
    id: string
    email: string
  }
  connections: Connection[]
  regions: Record<string, RegionInfo>
  cells: Record<string, CellInfo>
}

export interface SfInfo {
  username: string | null
  organization_id: string | null
  environment: string
  domain: string
  api_version: string
}

export interface Database {
  host: string
  database: string
  port: number
}

export interface Photos {
  picture: string
  thumbnail: string
}

export interface UserInfoStatus {
  created_date: string | null
  body: string | null
}

export interface Urls {
  enterprise: string
  metadata: string
  partner: string
  rest: string
  sobjects: string
  search: string
  query: string
  recent: string
  tooling_soap: string
  tooling_rest: string
  profile: string
  feeds: string
  groups: string
  users: string
  feed_items: string
  feed_elements: string
  custom_domain: string
}

export interface ProfilePerms {
  type: string
  Id: string
  PermissionsModifyAllData: string
  PermissionsViewAllData: string
  PermissionsViewAllUsers: string
}

export interface UserInfo {
  id: string
  asserted_user: boolean
  user_id: string
  organization_id: string
  username: string
  nick_name: string
  display_name: string
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  timezone: string
  photos: Photos
  addr_street: string | null
  addr_city: string | null
  addr_state: string | null
  addr_country: string | null
  addr_zip: string | null
  mobile_phone: string | null
  mobile_phone_verified: boolean
  is_lightning_login_user: boolean
  status: UserInfoStatus
  urls: Urls
  active: boolean
  user_type: string
  language: string
  locale: string
  utcOffset: number
  last_modified_date: string | null
  profile_perms: ProfilePerms
}

export interface Metrics {
  last_write_activity_time: string | null
}

export interface Features {
  cdc_for_accelerated_polling: boolean
  disable_bulk_writes: boolean
  drift_max_batches_in_parallel_override: boolean
  early_sf_api_access: boolean
  force_picklist_255: boolean
  get_deleted_latest_date_check: boolean
  increased_query_cursor_limit: boolean
  log_memory_usage: boolean
  mtls_shield_connection: boolean
  poll_db_no_merge: boolean
  poll_external_ids: boolean
  rest_count_only: boolean
  retry_failed_create_soap_call: boolean
  retry_get_query_batch_result_ids: boolean
  set_odata_extra_float_digits_to_0: boolean
  sync_repair_unlimited_query_all: boolean
  temp_tables_in_transactions: boolean
  testing_flag_only: boolean
  ucs_basic_collation_index: boolean
  use_assignment_rules: boolean
  verbose_sfnotifier_logging: boolean
}

export type ConnectionState = 'NEW' | 'NEED_AUTHENTICATION' | 'IDLE'
export type MappingsSummaryState = 'OK'

export interface ConnectionDetails {
  id: string
  _id: number
  name: string
  addon_id: string
  app_name: string
  team_name: string | null
  enterprise_account_name: string | null
  app_id: string
  schema_name: string
  db_key: string | null
  database: Database
  organization_id: string | null
  state: ConnectionState
  mappings_summary_state: MappingsSummaryState
  detail_url: string
  tags: string[]
  sf_info: SfInfo
  created_at: string
  auth_updated: string | null
  plan: string
  free_edition: boolean
  dogwood: boolean
  user_info: UserInfo
  metrics: Metrics
  logplex_log_enabled: boolean
  deletable: boolean
  resource_name: string
  large_query_threshold: number
  bulk_page_size: number
  features: Features
  internal_name: string
  notifications_url: string
  odata: Record<string, unknown> | null
  soap_batch_size: number
  sf_instance: string | null
  sf_region: string | null
  mappings: Mapping[]
  streams?: Stream[]
}

export type ConnectionWithDetails = Connection & ConnectionDetails
