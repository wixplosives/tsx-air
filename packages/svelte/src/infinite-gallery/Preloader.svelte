<script>
    const spinners = [...new Array(10).keys()];
    const colors = [
        'white',
        'grey',
        'darkgrey',
        'darkgrey',
        'black',
        'black',
        'black'
    ];
    const randColor = () => colors[(Math.random() * colors.length) | 0];

    const animationDir = i => {
        switch (i % 4) {
            case 0:
                return 'normal';
            case 1:
                return 'reverse';
            case 2:
                return 'alternate';
            case 3:
                return 'alternate-reverse';
        }
    };
</script>

<style>
    .preloader {
        height: 10vmax;
        width: 10vmax;
        position: relative;
        margin: 0;
        padding: 0;
    }

    .animator {
        width: 100%;
        height: 100%;
        position: absolute;
        animation: rot 1s infinite linear;
        filter: blur(2px);
    }

    .spinner {
        width: 100%;
        height: 100%;
        border-radius: 50% 50%;
        border-top: 1vmax solid;
        transform-origin: center center;
        /* border-color: black; */
        opacity: 0.7;
    }

    @keyframes rot {
        from {
            transform: rotateZ(0);
        }
        to {
            transform: rotateZ(360deg);
        }
    }
</style>

<div class="preloader">
    {#each spinners as i}
        <div
            class="animator"
            style="animation-duration: {((5 + i) * Math.PI) / 20}s; animation-delay: {-Math.random()}s;
            animation-direction: {animationDir(i)}">
            <div class="spinner" style="transform: scale({0.08 * i + 0.4}); border-color: {randColor()}" />
        </div>
    {/each}
</div>
