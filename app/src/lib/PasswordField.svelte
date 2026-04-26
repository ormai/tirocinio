<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';
	import { validator, validatePassword } from '$lib/validation.svelte';
	import { onMount } from 'svelte';

	let { visible = $bindable(false), name = 'password', label = 'Password' } = $props();
	let error = $state({ value: '' });
</script>

<div class="input-host">
	<label for={name}>{label}</label>
	<div>
		<input
			id={name}
			{name}
			type={visible ? 'text' : 'password'}
			autocomplete="current-password"
			required
			minlength="10"
			maxlength="200"
			{@attach (input) => validator(input, validatePassword, error)}
		/>
		<button
			type="button"
			class="secondary"
			onclick={() => {
				visible = !visible;
			}}
		>
			{#if visible}
				<EyeOff />
			{:else}
				<Eye />
			{/if}
		</button>
	</div>
	{#if error.value}
		<span class="error">{error.value}</span>
	{/if}
</div>

<style>
	div {
		display: flex;
	}

	label {
		width: 100%;
	}

	input {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		width: 100%;
	}

	button {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-left: none;
	}
</style>
