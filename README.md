# Are We There Yet: A Talk About The XR Ecosystem

I created this talk's framework by interacting with Copilot and fixing mistakes it made.


The rest of the readme from here down is Copilot's work.


## Project Structure

```
html-presentation
├── slides
│   ├── slide01.html
│   ├── slide02.html
│   └── slide03.html
├── src
│   ├── js
│   │   ├── main.js
│   │   └── shader.js
│   ├── css
│   │   └── styles.css
│   └── shaders
│       ├── vertexShader.glsl
│       └── fragmentShader.glsl
├── index.html
└── README.md
```

## Setup Instructions

1. **Clone the Repository**: 
   Clone this repository to your local machine using:
   ```
   git clone <repository-url>
   ```

2. **Install Dependencies**: 
   Ensure you have a local server to serve the HTML files. You can use tools like `http-server` or any other local server setup.

3. **Run the Presentation**: 
   Navigate to the project directory and start your local server. Open `index.html` in your web browser to view the presentation.

## Usage

- Navigate through the slides using the arrow keys or any navigation buttons you implement.
- The 3D world background is rendered using Three.js, and post-processing effects are applied using custom shaders.

## Customization

- You can modify the content of each slide by editing the respective HTML files in the `slides` folder.
- Adjust the styles in `src/css/styles.css` to change the appearance of the presentation.
- Modify the shaders in `src/shaders/vertexShader.glsl` and `src/shaders/fragmentShader.glsl` to customize the visual effects.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements or new features!