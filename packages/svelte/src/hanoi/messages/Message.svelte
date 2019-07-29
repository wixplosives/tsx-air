<script>
    export let type, message;
    import Err from './Error.svelte';
    import Bonus from './Bonus.svelte';
    import System from './System.svelte';
    import Time from './Time.svelte';
    import Party from './Party.svelte';

    const comp = (type) => {
        switch(type) {
            case 'error': 
                return Err;
            case 'bonus':
                return Bonus;
            case 'time':
                return Time;
            case 'party':
                return Party;
            default:
                return System;
        }
    }
</script>

<!-- This is NOT reactive, see Block.svelte for a reactive example -->
<svelte:component this={comp(type)} {message} /> 