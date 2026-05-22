# Devcenter draft: additions to "Heroku Connect CLI Plugin"

> **Status:** Draft for CX review. Pairs with heroku/heroku-connect-plugin#291 and #292 and the backend work in heroku/herokuconnect#11170 and #11171.
>
> **Target page:** https://devcenter.heroku.com/articles/heroku-connect-cli (existing).
>
> **Action:** Append the two command sections below to the "Heroku Connect CLI Commands" list, alphabetised next to the existing entries (after `connect:resume`, before `connect:state`).

---

## heroku connect:schema-diff

Compare the current Salesforce schema for each mapping in a connection against a target Salesforce API version. Use this command before [`connect:upgrade-api-version`](#heroku-connectupgrade-api-version) to preview the changes the upgrade would expose.

```
USAGE
  $ heroku connect:schema-diff -a APP [--resource RESOURCE] [--target-version VERSION] [--json]

OPTIONS
  -a, --app=app                (required) the Heroku app name
      --resource=resource      specific connection resource name
      --target-version=version Salesforce API version to compare against (e.g. `61.0`).
                               Defaults to the latest version supported by Heroku Connect.
      --json                   print output as JSON
```

`--target-version` is optional; when omitted, the diff is taken against the latest Salesforce API version supported by Heroku Connect (the same default `connect:upgrade-api-version` would target).

**Example:**

```
$ heroku connect:schema-diff -a my-app --target-version 61.0

=== Connection: my-app:fake-conn
Current API Version: 55.0
Target API Version:  61.0

 Mapping  Status            Details
 ───────  ────────────────  ──────────────────────────────────────────────
 Account  no changes        Salesforce field definitions have not changed.
 Contact  changed (safe)    Length has increased in Salesforce for field: Description.
 Lead     changed (unsafe)  Definitions have changed in Salesforce for field: Industry.
```

Status values:

- `no changes` — the mapping's Salesforce schema is identical at both versions.
- `changed (safe)` — only string-length increases. Heroku Connect alters the database table on the next sync to match the new length; no customer action required.
- `changed (unsafe)` — type changes, length decreases, or other modifications. You must unmap the listed fields, save the mapping, and remap them.
- `changed` — the connection's Heroku Connect backend hasn't been upgraded yet; the result message describes the change.

---

## heroku connect:upgrade-api-version

Upgrade a connection to a newer Salesforce API version. The connection must be paused. Run [`connect:schema-diff`](#heroku-connectschema-diff) first to preview the changes.

```
USAGE
  $ heroku connect:upgrade-api-version -a APP --target-version VERSION
                                       [--resource RESOURCE] [--force] [--confirm NAME] [--json]

OPTIONS
  -a, --app=app                (required) the Heroku app name
      --target-version=version (required) Salesforce API version to upgrade to (e.g. `61.0`)
      --resource=resource      specific connection resource name
      --force                  proceed even when mappings have unsafe field changes.
                               Does not override mappings with dropped fields — those
                               must be edited first.
      --confirm=NAME           skip the interactive confirmation by passing the
                               connection name
      --json                   print the API response as JSON
```

**Preconditions enforced by Heroku Connect:**

1. The connection must be in the `PAUSED` state. Run `heroku connect:pause` first.
2. `--target-version` must be a Salesforce API version supported by Heroku Connect.
3. The target version must differ from the connection's current API version.
4. If any mapping references a field that no longer exists at the target version, the upgrade is refused. Edit the mapping to remove the field, save it, and re-run the upgrade. `--force` does **not** override this check.
5. If any mapping has unsafe non-drop changes (type changes, length decreases) the upgrade is refused unless `--force` is passed.

**Confirmation prompt and `--confirm`:**

The CLI prompts you to type the connection name (the same value shown by `connect:state`) before dispatching the upgrade. To skip the prompt — for scripts or `--json` callers — pass `--confirm <connection-name>`. The value must match the connection name exactly (after trimming whitespace).

If your connection name contains shell-special characters (e.g. a colon as in `my-app:fake-conn`), quote it: `--confirm 'my-app:fake-conn'`.

**Typical workflow:**

```
$ heroku connect:pause -a my-app
$ heroku connect:schema-diff -a my-app --target-version 61.0
# review the table; address any "changed (unsafe)" mappings if you don't intend to use --force
$ heroku connect:upgrade-api-version -a my-app --target-version 61.0
Upgrade my-app:fake-conn from API 55.0 to 61.0? Type the connection name to confirm
> my-app:fake-conn
Upgrading my-app:fake-conn to API 61.0... done

Upgrade dispatched. my-app:fake-conn will run at Salesforce API 61.0.
Run `heroku connect:resume` when you are ready to resume sync.

$ heroku connect:resume -a my-app
```

**Error responses:**

```
Cannot upgrade: some mappings reference fields that no longer exist at the target API version.
  Account: legacyfield__c
Edit each mapping to remove the listed fields, then re-run.
```

Edit each listed mapping in the Heroku Connect dashboard to remove the dead fields, save, and re-run.

```
Cannot upgrade: some mappings have unsafe field changes at the target API version.
Affected mappings: Account, Lead
Re-run with --force to proceed anyway, or edit the mappings first.
```

Re-run with `--force` to proceed, or edit the affected mappings first.
