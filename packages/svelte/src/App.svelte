<script>
	import Parent from './Parent.svelte';
	import HelloWorld from './Parent.svelte';
	export let name;
</script>

<Parent>
	<HelloWorld {name} />
</Parent>