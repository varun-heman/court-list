# Court Navigator

A web application to help users find and explore various courts and legal bodies across India.

## Features

- Browse and search for courts by name, type, and location
- Filter courts by state, case types, and document types
- View detailed information about each court
- Interactive map view to visualize court locations
- Responsive design for desktop and mobile devices

## Technology Stack

- HTML5, CSS3, and JavaScript
- Leaflet.js for interactive maps
- OpenStreetMap for map tiles
- Nominatim for geocoding

## Deployment

This application is deployed on Netlify. You can view it at [insert-your-netlify-url-here].

## Local Development

To run this application locally:

1. Clone the repository
2. Navigate to the `static-site` directory
3. Open `index.html` in your browser or use a local server

```bash
# Example using Python's built-in HTTP server
cd static-site
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

## Project Structure

```
static-site/
├── assets/
│   ├── css/         # Stylesheets
│   ├── data/        # JSON data files
│   ├── img/         # Images and icons
│   └── js/          # JavaScript files
├── index.html       # Main HTML file
├── _redirects       # Netlify redirects configuration
├── netlify.toml     # Netlify configuration
└── README.md        # This file
```

## Data Structure

The application uses a JSON file (`courts-data.json`) containing information about various legal bodies in India, including:

- Name
- Type
- Description
- Location
- State
- Geographical Jurisdiction
- Case Types
- Document Types
- Website URL

## License

[Your license information here]
