<script>
    import { onMount } from 'svelte';
    import api from './store';
    const { timer } = api;

    $: minutes = ($timer.time / 60000) | 0;
    $: msec = $timer.time;
    $: alert1 = msec < 15000;
    $: alert2 = msec < 10000;
    $: alert3 = msec < 5000;
    $: done = msec <= 0;
</script>

<style>
    svg {
        width: 5vmax;
        height: 5vmax;
    }

    .clock-face {
        stroke: #333;
        fill: white;
    }
   
    .clock-face.alert1 {
        fill: yellow;
    }
    .clock-face.alert2 {
        fill: orange;
    }
    .clock-face.alert3 {
        fill: red;
    }
    .clock-face.done {
        fill: darkred;
    }
     

    .minor {
        stroke: #999;
        stroke-width: 0.5;
    }

    .major {
        stroke: #333;
        stroke-width: 1;
    }

    .minute {
        stroke: #666;
        stroke-width: 3;
    }

    .second,
    .second-counterweight {
        stroke: rgb(180, 0, 0);
        stroke-linecap: butt;
        stroke-width: 2;
    }

    .second-counterweight {
        stroke-width: 5;
    }
</style>

<svg viewBox="-50 -50 100 100" on:click>
    <circle class="clock-face" r="48" class:alert1 class:alert2 class:alert3 class:done />

    <!-- markers -->
    {#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
        <line class="major" y1="35" y2="45" transform="rotate({30 * minute})" />

        {#each [1, 2, 3, 4] as offset}
            <line class="minor" y1="42" y2="45" transform="rotate({6 * (minute + offset)})" />
        {/each}
    {/each}

    <!-- minute hand -->
    <line class="minute" y1="4" y2="-30" transform="rotate({30 * minutes})" />

    <!-- second hand -->
    <g transform="rotate({360/60/1000 * msec})">
        <line class="second" y1="10" y2="-38" />
        <line class="second-counterweight" y1="10" y2="2" />
    </g>
</svg>
