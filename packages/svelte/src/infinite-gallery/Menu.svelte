<script>
    import { menu } from './store';
    const selected = $menu.selected;
    // $: s = $menu.selected;
    // s = s+'3';
    // console.log(s);
</script>

<style>
    section {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
    }
</style>

<section>
    {#each $menu.options as { label, options, value }}
        <label>
            {label}
            <select on:blur={() => menu.setSelected(selected)} bind:value={selected[value]}>
                {#each options as { desc, value }}
                    <option {value}>{desc || value}</option>
                {/each}
            </select>
        </label>
    {/each}
</section>
