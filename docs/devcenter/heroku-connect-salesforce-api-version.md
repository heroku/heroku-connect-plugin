# Devcenter draft: new article — "Upgrading the Salesforce API Version of a Heroku Connect Connection"

> **Status:** Draft for CX review.
>
> **Suggested URL slug:** `/articles/heroku-connect-salesforce-api-version`
>
> **Action:** New standalone article. Cross-link from the existing `heroku-connect-cli` page (next to the new `connect:upgrade-api-version` section), and from `heroku-connect-deprecations` (or wherever the Salesforce API deprecation announcements live).

---

# Upgrading the Salesforce API Version of a Heroku Connect Connection

Each Heroku Connect connection runs against a specific [Salesforce REST/SOAP API version](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls.htm). The API version is fixed when the connection is created and must be upgraded explicitly. Salesforce retires older API versions on an [announced schedule](https://help.salesforce.com/s/articleView?id=001114581&type=1); when an API version your connection uses is removed, sync will fail.

This article describes how to use the Heroku CLI to:

1. See which Salesforce API version a connection currently uses.
2. Preview the schema differences between the current version and a target version.
3. Upgrade the connection in place to a newer Salesforce API version.

## When you need to upgrade

You need to upgrade a connection's Salesforce API version when any of the following are true:

- Salesforce has announced an end-of-life date for the version your connection uses.
- A new field type, object, or capability you want to consume is only available in a newer Salesforce API version.
- Heroku Connect support has asked you to.

You do **not** need to upgrade the API version to receive routine Heroku Connect updates — those ship through Heroku's normal add-on release pipeline and are independent of Salesforce API versioning.

## Prerequisites

- The [Heroku Connect CLI plugin](heroku-connect-cli) installed and authenticated.
- An app with a Heroku Connect add-on, with at least one configured mapping.
- A maintenance window. The upgrade requires the connection to be paused; sync is unavailable until you resume it.

## Step 1: Identify the current API version

```
$ heroku connect:state -a my-app
```

The output table includes the connection's current `api_version`.

## Step 2: Preview the schema differences

Before upgrading, compare each mapping's Salesforce schema between the current version and your target. This lets you find mappings that need attention before the upgrade and avoid surprises.

```
$ heroku connect:schema-diff -a my-app --target-version 61.0
```

The output is a per-mapping table:

| Status            | Meaning                                                                                          | What you need to do                       |
| ----------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `no changes`      | The mapping's Salesforce schema is identical at both versions.                                   | Nothing.                                  |
| `changed (safe)`  | Only string-length increases. Heroku Connect alters the database column to match.                | Nothing — the upgrade applies it for you. |
| `changed (unsafe)`| Type changes, length decreases, or other modifications.                                          | See [Handling unsafe changes](#handling-unsafe-changes). |
| `changed`         | Older backend without per-mapping unsafety classification.                                       | Read the `Details` column.                |

Customer-applied transformations or filters are preserved across the upgrade — `connect:upgrade-api-version` only refreshes Salesforce-side schema definitions. Your existing mapping configuration (selected fields, write access, polling settings) is unchanged.

## Step 3: Pause the connection

```
$ heroku connect:pause -a my-app
```

The upgrade endpoint refuses to run unless the connection is paused. This is intentional — sync would otherwise race the schema change.

## Step 4: Run the upgrade

```
$ heroku connect:upgrade-api-version -a my-app --target-version 61.0
```

The CLI prompts you to type the connection name to confirm. Pass `--confirm <name>` to skip the prompt (useful for scripts).

On success the CLI prints `Upgrade dispatched.` and the connection stays paused. Heroku Connect updates `api_version`, refreshes the cached Salesforce schema for every mapping at the new version, and writes an audit log entry.

## Step 5: Resume

```
$ heroku connect:resume -a my-app
```

Sync runs at the new API version from this point.

## Handling unsafe changes

The diff classifies field changes as either *safe* or *unsafe*:

- **Safe:** Salesforce increased the length of a string field. Heroku Connect handles this automatically — your database column will be widened on next sync.
- **Unsafe:** Salesforce changed the field's type, decreased a string length, or changed something else that requires a column-level migration. The upgrade refuses these by default to give you a chance to remediate.

You have two options for each unsafe mapping:

1. **Remediate before upgrading.** In the Heroku Connect dashboard, edit the mapping, unselect the affected field, save, then re-select the field and save again. This refreshes the field metadata. Repeat for each affected mapping, then re-run `connect:upgrade-api-version`.
2. **Upgrade with `--force` and remediate after.** Re-run with `--force` and the upgrade will dispatch despite the unsafe changes. You'll still need to unmap/remap the affected fields afterwards before sync resumes cleanly.

```
$ heroku connect:upgrade-api-version -a my-app --target-version 61.0 --force
```

## Handling dropped fields

If any mapping references a Salesforce field that no longer exists at the target API version, the upgrade refuses **even with `--force`**:

```
Cannot upgrade: some mappings reference fields that no longer exist at the target API version.
  Account: legacyfield__c
Edit each mapping to remove the listed fields, then re-run.
```

To fix this, edit each listed mapping in the Heroku Connect dashboard, unselect the dead fields, and save. Then re-run the upgrade.

This guard exists because Heroku Connect would otherwise lose the ability to read or sync a field your dataset still references — there's no safe automatic remediation, so we require an explicit edit.

## Rollback

The upgrade is in-place. To revert, run `connect:upgrade-api-version` again with the previous version as `--target-version`. The same diff/safety rules apply — preview with `connect:schema-diff` first.

## Related commands

- [`heroku connect:schema-diff`](heroku-connect-cli#heroku-connectschema-diff)
- [`heroku connect:upgrade-api-version`](heroku-connect-cli#heroku-connectupgrade-api-version)
- [`heroku connect:pause`](heroku-connect-cli#heroku-connectpause)
- [`heroku connect:resume`](heroku-connect-cli#heroku-connectresume)
