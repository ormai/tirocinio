<!--
	@component

	Segmented buttons are a group of buttons of which only one can be active at a
	time. They are similar to the concept of "tabs".

	They can also be thouth as radio buttons with extra steps.
	
	Segmented buttons are part of [Material UI 3](https://m3.material.io/components/segmented-buttons/overview).
-->

<script lang="ts">
	interface Option {
		label: string;
		value: string;
	}

	let {
		options = [],
		selected = $bindable(options[0]?.value)
	}: { options: Option[]; selected: string } = $props();

	let currentIndex = $derived(options.findIndex((opt) => opt.value === selected));

	/// Buttons should be activatable by pressing 'Enter', not just 'Space'.
	function onKeyDown(event: KeyboardEvent, value: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			selected = value;
		}
	}
</script>

<fieldset style:--count={options.length} style:--index={currentIndex}>
	<div class="selection"></div>
	{#each options as option}
		<label for={option.value} class:active={selected === option.value}>
			{option.label}
			<input
				type="radio"
				value={option.value}
				id={option.value}
				bind:group={selected}
				onkeydown={(e) => onKeyDown(e, option.value)}
			/>
		</label>
	{/each}
</fieldset>

<style>
	fieldset {
		--padding: 2px;
		position: relative;
		display: flex;
		padding: var(--padding);
		background: var(--body-light-bg);
		border-radius: var(--radius);
		border: 1px solid var(--border);
		width: 100%;
	}

	@media (max-width: 400px) {
		fieldset {
			flex-direction: column;
		}

		div.selection {
			transform: translateY(calc(100% * var(--index)));
			height: calc((100% - var(--padding) * 2) / var(--count));
			width: calc(100% - var(--padding) * 2);
		}
	}

	.selection {
		position: absolute;
		top: var(--padding);
		left: var(--padding);
		bottom: var(--padding);
		width: calc((100% - var(--padding) * 2) / var(--count));
		height: calc(100% - var(--padding) * 2);

		z-index: 1;
		background: var(--body-lighter-bg);

		/* https://www.30secondsofcode.org/css/s/nested-border-radius/ */
		border-radius: calc(var(--radius) - var(--padding));

		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateX(calc(100% * var(--index)));
	}

	label {
		flex: 1;
		cursor: pointer;
		text-align: center;
		padding: 5px 0;
		user-select: none;
		color: var(--body-lighter);
		transition: color 0.2s ease;
		z-index: 2;

		&.active {
			color: var(--body);
		}

		&:hover:not(.active),
		&:active:not(.active) {
			color: var(--primary-text);
		}

		&:has(input:focus-visible) {
			box-shadow: var(--focus-shadow);
			border-radius: calc(var(--radius) - var(--padding));
		}
	}

	input {
		cursor: pointer;
		opacity: 0;
		width: 0;
		height: 0;
	}
</style>
