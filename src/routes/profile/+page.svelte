<script lang="ts">
  import { Field } from '$lib/form/field.svelte';
  import PasswordField from '$lib/form/PasswordField.svelte';

  const currentPassword = new Field();
  const newPassword = new Field();
  const newPasswordConfirm = new Field();
</script>

<h1>Profile</h1>

<form>
  <div class="input-host">
    <label for="name">Name</label>
    <input name="name" id="name" autocomplete="given-name" />
  </div>

  <div class="input-host">
    <label for="surname">Surname</label>
    <input name="surname" id="surname" autocomplete="family-name" />
  </div>

  <PasswordField name="current-password" field={currentPassword} label="Current password" />
  <PasswordField name="new-password" field={newPassword} label="New password" />
  <PasswordField field={newPasswordConfirm} label="Confirm new password" />
</form>
