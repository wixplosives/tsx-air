<script>
    export let items = [];
</script>

<style>
    .page {
        display: grid;
        grid-template-rows: 1fr 1fr 1fr 1fr;
        grid-template-columns: 1fr 1fr 1fr;
    }
</style>

<div class="page">
    {#each items as item}
        <slot {item} />
    {/each}
</div>
