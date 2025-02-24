module.exports = {
    content: [
        './src/**/*.{html,js,svelte,ts}',
        "./node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}"
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require("daisyui"),
    ],
    daisyui: {
        themes: ["nord"],
    },
} 