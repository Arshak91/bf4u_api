exports.getMainMarker = (req, res) => {
    let svg = '';

    if (req.query.selected) {
        svg = `<?xml version="1.0" encoding="UTF-8"?>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                xml:space="preserve" 
                width="0.864437in" 
                height="1.00907in" 
                version="1.1"
                viewBox="0 0 864.43 1009.07"
                xmlns:xlink="http://www.w3.org/1999/xlink"
             >
                <g id="Layer_x0020_1">
                    <metadata id="CorelCorpID_0Corel-Layer"/>
                    <path class="fil0" d="M608.37 432.23c0,-97.28 -78.83,-176.16 -176.12,-176.16 -97.29,0 -176.18,78.88 -176.18,176.16 0,97.29 78.89,176.13 176.18,176.13 97.28,0 176.12,-78.84 176.12,-176.13zm-608.37 0c0,-238.73 193.51,-432.23 432.25,-432.23 238.68,0 432.18,193.51 432.18,432.23 0,222.52 -213.02,401.36 -376.07,554.56 -31.57,29.69 -80.62,29.69 -112.25,0 -163.1,-153.2 -376.12,-332.04 -376.12,-554.56z"/>
                </g>
            </svg>`;
    } else if (req.query.locked) {
        svg = `<?xml version="1.0" encoding="utf-8"?>
        <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69.62 80.03">
            <g id="Layer_1-2" data-name="Layer_1">
                <path d="M0,34.81A34.75,34.75,0,0,1,10.19,10.19l.22-.19a34.78,34.78,0,0,1,49,.2l.2.21a34.69,34.69,0,0,1,10,24.4c0,16.34-13.64,29-25.41,40L41.3,77.49a9.54,9.54,0,0,1-13-.06l-2.86-2.65C13.64,63.84,0,51.16,0,34.81Zm15.41-19.4a27.35,27.35,0,0,0-8,19.4C7.38,48,19.75,59.46,30.43,69.39L33.28,72a2.17,2.17,0,0,0,1.53.61,2.19,2.19,0,0,0,1.5-.58l2.89-2.69c10.67-9.92,23-21.42,23-34.57a27.35,27.35,0,0,0-7.86-19.23l-.17-.17a27.46,27.46,0,0,0-38.63-.18l-.17.18Z" transform="translate(0)"/>
            </g>
            <path id="Union_55" data-name="Union 55" d="M27.5,50.29a7.26,7.26,0,0,1-7.29-7.21v-9.7a7.28,7.28,0,0,1,7.29-7.22H42a7.27,7.27,0,0,1,7.28,7.22v9.7A7.25,7.25,0,0,1,42,50.29ZM22.74,33.38v9.7a4.75,4.75,0,0,0,4.76,4.71H42a4.73,4.73,0,0,0,4.75-4.71v-9.7A4.74,4.74,0,0,0,42,28.67H27.5a4.75,4.75,0,0,0-4.76,4.71Zm8.47,4.85a3.54,3.54,0,1,1,3.54,3.5A3.53,3.53,0,0,1,31.21,38.23Zm9.91-15a6.37,6.37,0,1,0-12.73,0,1.27,1.27,0,1,1-2.53,0,8.9,8.9,0,1,1,17.79,0,1.27,1.27,0,1,1-2.53,0Z" transform="translate(0)"/>
        </svg>`;
    } else {
        svg = `<?xml version="1.0" encoding="UTF-8"?>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                xml:space="preserve" width="0.966902in" 
                height="1.11155in" 
                version="1.1"
                viewBox="0 0 966.9 1111.55"
                xmlns:xlink="http://www.w3.org/1999/xlink"
            >
             <g id="Layer_x0020_1">
                <path fill="#fff" class="fil0" d="M608.36 483.47c0,-34.57 -13.94,-65.86 -36.46,-88.47 -22.61,-22.42 -53.94,-36.46 -88.42,-36.46 -34.63,0 -65.91,13.95 -88.33,36.42 -22.67,22.61 -36.61,53.9 -36.61,88.52 0,34.48 14.04,65.81 36.56,88.33l2.08 2.22c22.42,21.26 52.83,34.33 86.29,34.33 34.48,0 65.81,-14.04 88.33,-36.56 22.52,-22.52 36.56,-53.85 36.56,-88.33zm35.89 -160.72c41.11,41.26 66.58,98.11 66.58,160.72 0,62.71 -25.47,119.66 -66.58,160.77 -41.11,41.11 -97.96,66.59 -160.77,66.59 -61.11,0 -116.76,-24.26 -157.67,-63.68l-3.15 -2.91c-41.11,-41.11 -66.59,-98.06 -66.59,-160.77 0,-62.56 25.47,-119.32 66.54,-160.48 41.5,-41.45 98.35,-66.92 160.87,-66.92 62.71,0 119.66,25.47 160.77,66.68zm-644.25 160.72c0,-133.46 54.18,-254.47 141.59,-341.88l3 -2.76c87.26,-85.81 206.92,-138.83 338.88,-138.83 133.51,0 254.42,54.19 341.83,141.6l2.76 3c85.81,87.26 138.83,206.92 138.83,338.88 0,226.97 -189.39,403.09 -352.82,555l-40.44 37.72c-25.52,23.44 -57.87,35.35 -90.16,35.35 -32.44,0 -65.08,-12.11 -90.85,-36.17l-39.66 -36.8c-163.48,-151.96 -352.97,-328.03 -352.97,-555.1zm214.04 -269.44c-68.91,68.91"/>
                <path class="fil0" d="M608.36 483.47c0,-34.57 -13.94,-65.86 -36.46,-88.47 -22.61,-22.42 -53.94,-36.46 -88.42,-36.46 -34.63,0 -65.91,13.95 -88.33,36.42 -22.67,22.61 -36.61,53.9 -36.61,88.52 0,34.48 14.04,65.81 36.56,88.33l2.08 2.22c22.42,21.26 52.83,34.33 86.29,34.33 34.48,0 65.81,-14.04 88.33,-36.56 22.52,-22.52 36.56,-53.85 36.56,-88.33zm35.89 -160.72c41.11,41.26 66.58,98.11 66.58,160.72 0,62.71 -25.47,119.66 -66.58,160.77 -41.11,41.11 -97.96,66.59 -160.77,66.59 -61.11,0 -116.76,-24.26 -157.67,-63.68l-3.15 -2.91c-41.11,-41.11 -66.59,-98.06 -66.59,-160.77 0,-62.56 25.47,-119.32 66.54,-160.48 41.5,-41.45 98.35,-66.92 160.87,-66.92 62.71,0 119.66,25.47 160.77,66.68zm-644.25 160.72c0,-133.46 54.18,-254.47 141.59,-341.88l3 -2.76c87.26,-85.81 206.92,-138.83 338.88,-138.83 133.51,0 254.42,54.19 341.83,141.6l2.76 3c85.81,87.26 138.83,206.92 138.83,338.88 0,226.97 -189.39,403.09 -352.82,555l-40.44 37.72c-25.52,23.44 -57.87,35.35 -90.16,35.35 -32.44,0 -65.08,-12.11 -90.85,-36.17l-39.66 -36.8c-163.48,-151.96 -352.97,-328.03 -352.97,-555.1zm214.04 -269.44c-68.91,68.91 -111.57,164.21 -111.57,269.44 0,182.71 171.86,342.41 320.14,480.23l39.56 36.9c5.86,5.67 13.56,8.47 21.31,8.47 7.5,0 15.01,-2.71 20.87,-8.04l40.09 -37.43c148.23,-137.77 319.99,-297.48 319.99,-480.14 0,-104.06 -41.7,-198.4 -109.1,-267.11l-2.47 -2.33c-68.91,-68.91 -164.21,-111.57 -269.38,-111.57 -104.07,0 -198.4,41.69 -267.11,109.1l-2.32 2.47z"/>
             </g>
            </svg>`;
    }

    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(svg);
    res.end();
};

exports.getMarker = (req, res) => {
    const width = req.query.width ? req.query.width : 28;
    const height = req.query.height ? req.query.height : 48;
    let markerBgColor = req.query.isSelected ? '#707070' : '#FFFFFF';
    let textColor = req.query.isSelected ? '#FFFFFF' : '#707070';
    const color = req.query.color = req.query.color ? '#' + req.query.color : false;

    if (color) {
        markerBgColor = color;
        textColor = '#000';
    }

    const text = `<?xml version="1.0" encoding="utf-8"?>
    <!-- Generator: Adobe Illustrator 24.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
    <svg width="${width}" height="${height}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 32 65" style="enable-background:new 0 0 32 65;" xml:space="preserve">
    <defs>
        <style>
            @import url("https://fonts.googleapis.com/css?family=Open+Sans")
        </style>
    </defs>
    <style type="text/css">
        .st0{fill-rule:evenodd;clip-rule:evenodd;fill:${markerBgColor};}
        .st1{fill:${markerBgColor};}
        .st2{fill:#FFFFFF;}
        .st3{font-family:'Open Sans Bold';fill:${textColor}}
        .st4{font-size:13.9752px;}
    </style>
    <g id="Group_1907" transform="translate(-15201.009 -831.61)">
        <g id="Group_1905" transform="translate(14737.687 544.065)">
            <g id="Group_1748" transform="translate(463.322 295.935)">
                <g id="Group_1746">
                    <path id="Path_1113" class="st0" d="M16.04,39.45C10.19,30.83,4.8,22.46,1.07,13.12C-2.89,3.22,4.46-7.92,15.54-8.38
                        c10.6-0.43,18.86,9.95,15.8,20.06c-2.03,6.69-5.67,12.61-9.3,18.52C20.19,33.23,18.18,36.16,16.04,39.45z"/>
                </g>
            </g>
            <g id="Group_1749" transform="translate(473.915 348.865)">
                <path id="Path_1115" class="st1" d="M10.79-3.07c0,2.99-2.42,5.41-5.41,5.41s-5.41-2.42-5.41-5.41s2.42-5.41,5.41-5.41l0,0
                    C8.36-8.48,10.79-6.06,10.79-3.07z"/>
            </g>
        </g>
        <text transform="matrix(1 0 0 1 15213.0029 851.5743)" class="st2 st3 st4">${ req.query.index ? req.query.index : '' }</text>
    </g>
    </svg>`;
    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};

exports.getUnplannedMarker = (req, res) => {
    const width = req.query.width ? req.query.width : 100;
    const height = req.query.height ? req.query.height : 69;
    const markerBgColor = req.query.isSelected ? '#707070' : '#FFFFFF';
    const borderColor = req.query.isSelected ? 'transparent' : '#707070';
    const textColor = req.query.isSelected ? '#FFFFFF' : '#707070';

    const text = `<?xml version="1.0" encoding="utf-8"?>
    <!-- Generator: Adobe Illustrator 24.0.2, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
    <svg width="${width}" height="${height}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 94.7 64.9" style="enable-background:new 0 0 94.7 64.9;" xml:space="preserve">
        <defs>
            <style>
                @import url("https://fonts.googleapis.com/css?family=Open+Sans:400,600,700")
            </style>
        </defs>
        <style type="text/css">
            .st0{fill:${markerBgColor};}
            .borderColor{fill:${borderColor};}
            .st1{fill:#707070}
            .st2{fill:#040404;}
            .st3{font-family: 'Open Sans', sans-serif;font-weight:600;fill:${textColor}}
            .st4{font-size:14px;}
            .st5{font-size:12px;}
        </style>
        <g>
            <g>
                <path class="st0" d="M88,1.1H16.5v28H88c3,0,5.5-2.5,5.5-5.5v-17C93.5,3.6,91.1,1.1,88,1.1z"/>
                <path class="borderColor" d="M88,0.1H15.5v30H88c3.6,0,6.5-2.9,6.5-6.5v-17C94.5,3.1,91.6,0.1,88,0.1z M93.5,23.6c0,3-2.5,5.5-5.5,5.5
                H16.5v-28H88c3,0,5.5,2.5,5.5,5.5V23.6z"/>
            </g>
            <g id="Group_2033" transform="translate(6.015 5.003)">
            <g>
                <path class="st0" d="M22.3,2.2c-2.9-3.8-7.4-6-12.1-6c-0.2,0-0.4,0-0.6,0C4.4-3.6-0.3-0.9-3,3.3C-5.7,7.5-6.3,12.5-4.5,17
                c3.7,9.3,9.2,17.7,14.5,25.6c0.6-0.8,1.1-1.7,1.6-2.5c1.4-2.1,2.7-4.1,4-6.1c3.6-5.8,7.2-11.8,9.2-18.4
                C26.3,11,25.3,6.1,22.3,2.2z"/>
                <path class="borderColor" d="M23.1,1.6C19.8-2.7,14.7-5,9.5-4.8C4.1-4.6-0.9-1.8-3.9,2.8c-2.9,4.4-3.4,9.7-1.5,14.5c3.8,9.6,9.5,18.3,15,26.4l0.4,0.6
                l0.4-0.6c0.7-1.1,1.4-2.1,2-3.1c1.4-2.1,2.7-4.1,4-6.2c3.6-5.8,7.3-11.9,9.3-18.6C27.3,11,26.3,5.7,23.1,1.6z M11.7,40.1
                c-0.5,0.8-1.1,1.6-1.6,2.5C4.7,34.7-0.8,26.3-4.5,17C-6.3,12.5-5.7,7.5-3,3.3c2.8-4.3,7.5-7,12.6-7.2c0.2,0,0.4,0,0.6,0
                c4.7,0,9.2,2.2,12.1,6c3,3.9,4,8.8,2.6,13.4c-2,6.6-5.7,12.6-9.2,18.4C14.4,36,13,38,11.7,40.1z"/>
                <path class="st0" d="M10,49c-2.7,0-4.9,2.2-4.9,4.9s2.2,4.9,4.9,4.9c2.7,0,4.9-2.2,4.9-4.9C14.9,51.2,12.7,49,10,49z"/>
                <path class="borderColor" d="M10,48c-3.3,0-5.9,2.7-5.9,5.9s2.7,5.9,5.9,5.9s5.9-2.7,5.9-5.9C15.9,50.6,13.2,48,10,48z M10,58.8
                c-2.7,0-4.9-2.2-4.9-4.9S7.3,49,10,49c2.7,0,4.9,2.2,4.9,4.9C14.9,56.6,12.7,58.8,10,58.8z"/>
            </g>
                <text transform="matrix(1 0 0 1 2.0007 14.648)" class="st2 st3 st4"></text>
            </g>
            <text transform="matrix(1 0 0 1 38.0157 19.651)" class="st1 st3 st5">ID ${ req.query.orderId ? req.query.orderId : '' }</text>
        </g>
    </svg>
    `;
    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};

exports.getPlannedMarker = (req, res) => {
    const width = req.query.width ? req.query.width : 28;
    const height = req.query.height ? req.query.height : 48;

    const text = `<?xml version="1.0" encoding="utf-8"?>
        <!-- Generator: Adobe Illustrator 24.0.2, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
        <svg  width="${width}" height="${height}" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 32 64" style="enable-background:new 0 0 32 64;" xml:space="preserve">
            <style type="text/css">
            .st0{clip-path:url(#SVGID_2_);}
            .st1{fill-rule:evenodd;clip-rule:evenodd;fill:#FFFFFF;}
            .st2{fill:#FFFFFF;}
            .st3{fill:#707070;}
            </style>
        <g>
            <defs>
                <rect id="SVGID_1_" width="32" height="64"/>
            </defs>
            <clipPath id="SVGID_2_">
                <use xlink:href="#SVGID_1_"  style="overflow:visible;"/>
            </clipPath>
            <g id="Artboard_5" class="st0">
            <g id="Group_1907" transform="translate(-8.015 -7.706)">
            <g id="Group_2032">
            <g id="Group_2031">
            <g id="Group_1905">
            <g id="Group_1748">
            <g id="Group_1746">
            <g transform="matrix(1, 0, 0, 1, 8.01, 7.71)">
            <path id="Path_1113-2" class="st1" d="M16,47.8c-5.9-8.6-11.2-17-15-26.3c-4-9.9,3.4-21,14.5-21.5
            C26.1-0.4,34.4,10,31.3,20.1c-2,6.7-5.7,12.6-9.3,18.5C20.2,41.6,18.2,44.5,16,47.8z"/>
            </g>
            </g>
            </g>
            <g id="Group_1749">
            <g transform="matrix(1, 0, 0, 1, 8.01, 7.71)">
            <path id="Path_1115-2" class="st2" d="M21.4,58.2c0,3-2.4,5.4-5.4,5.4s-5.4-2.4-5.4-5.4s2.4-5.4,5.4-5.4l0,0l0,0
            C19,52.8,21.4,55.3,21.4,58.2z"/>
            </g>
            </g>
            </g>
            </g>
            </g>
            </g>
            <path id="Path_111" class="st3" d="M21.2,13v-1.8C21.2,8.3,18.9,6,16,6s-5.2,2.3-5.2,5.2l0,0V13c-1,0.1-1.8,1-1.8,2v6.3
            c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V15C23,14,22.2,13.2,21.2,13z M16,7.7c2,0,3.6,1.6,3.6,3.6V13h-7.1v-1.8
            C12.4,9.3,14,7.7,16,7.7z M21.3,21.3c0,0.2-0.1,0.3-0.3,0.3c0,0,0,0,0,0H11c-0.2,0-0.3-0.1-0.3-0.3c0,0,0,0,0,0V15
            c0-0.2,0.1-0.3,0.3-0.3h10c0.2,0,0.3,0.1,0.3,0.3L21.3,21.3z"/>
            </g>
            </g>
        </svg>
    `;
    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};

exports.getEventMarker = (req, res) => {
    const width = req.query.width ? req.query.width : 15;
    const height = req.query.height ? req.query.height : 15;
    const markerBgColor = req.query.bgColor ? req.query.bgColor : '000000';

    const text = `<?xml version="1.0" encoding="iso-8859-1"?>
                <svg width="${width}" height="${height}" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 29.107 29.107" style="enable-background:new 0 0 29.107 29.107;" xml:space="preserve">
                    <g>
                        <g id="c147_full_moon">
                            <g>
                                <path fill="#${markerBgColor}" d="M14.554,0C6.561,0,0,6.562,0,14.552c0,7.996,6.561,14.555,14.554,14.555c7.996,0,14.553-6.559,14.553-14.555
                                C29.106,6.562,22.55,0,14.554,0z"/>
                            </g>
                        </g>
                    <g id="Capa_1_14_">
                    </g>
                    </g>
                </svg>

    `;
    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};

exports.getDeliveryTruckMarker = (req, res) => {
    const width = req.query.width ? req.query.width : 25;

    const text = `<?xml version="1.0" encoding="iso-8859-1"?>
    <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	    style="width: ${width}px; height: auto;" viewBox="0 0 612 612" xml:space="preserve">

	<path d="M21.474,377.522V117.138c0-14.469,11.729-26.199,26.199-26.199h260.25c14.469,0,26.198,11.73,26.198,26.199v260.385
		c0,4.823-3.909,8.733-8.733,8.733H30.207C25.383,386.256,21.474,382.346,21.474,377.522z M231.634,466.724
		c0,30.01-24.329,54.338-54.338,54.338c-30.009,0-54.338-24.328-54.338-54.338c0-30.011,24.329-54.338,54.338-54.338
		C207.305,412.386,231.634,436.713,231.634,466.724z M204.464,466.724c0-15.005-12.164-27.169-27.169-27.169
		s-27.17,12.164-27.17,27.169s12.165,27.17,27.17,27.17S204.464,481.729,204.464,466.724z M130.495,412.385H8.733
		c-4.823,0-8.733,3.91-8.733,8.733v26.495c0,4.823,3.91,8.733,8.733,8.733h97.598C108.879,438.862,117.704,423.418,130.495,412.385z
		 M515.938,466.724c0,30.01-24.329,54.338-54.338,54.338c-30.01,0-54.338-24.328-54.338-54.338
		c0-30.011,24.328-54.338,54.338-54.338C491.609,412.385,515.938,436.713,515.938,466.724z M488.77,466.724
		c0-15.005-12.165-27.169-27.17-27.169c-15.006,0-27.169,12.164-27.169,27.169s12.164,27.17,27.169,27.17
		S488.77,481.729,488.77,466.724z M612,421.118v26.495c0,4.823-3.91,8.733-8.733,8.733h-70.704
		c-5.057-34.683-34.906-61.427-70.961-61.427c-36.062,0-65.912,26.745-70.969,61.427H248.261
		c-2.549-17.483-11.373-32.928-24.164-43.961h134.994V162.594c0-9.646,7.82-17.466,17.466-17.466h82.445
		c23.214,0,44.911,11.531,57.9,30.77l53.15,78.721c7.796,11.547,11.962,25.161,11.962,39.094v118.672h21.253
		C608.09,412.385,612,416.295,612,421.118z M523.408,256.635l-42.501-60.393c-1.636-2.324-4.3-3.707-7.142-3.707H407.47
		c-4.822,0-8.733,3.91-8.733,8.733v60.393c0,4.824,3.91,8.733,8.733,8.733h108.798C523.342,270.394,527.48,262.421,523.408,256.635z
		"/>
    
    </svg>

    `;
    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};

exports.getDepotMarker = (req, res) => {
    const text = `<?xml version="1.0" encoding="utf-8"?>
            <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
            <style type="text/css">
            .st0{fill:#FFFFFF;}
            </style>
            <g>
            <g>
            <path d="M256,0C150.1,0,64,86.1,64,192c0,133.1,173.3,307.9,180.7,315.3c3.1,3.1,7.2,4.7,11.3,4.7c4.1,0,8.2-1.6,11.3-4.7
            C274.7,499.9,448,325.1,448,192C448,86.1,361.9,0,256,0z"/>
            </g>
            </g>
            <path class="st0" d="M335.2,163.1c-1.9,5.3-6.9,8.9-12.6,8.9h-13.3v66.6c0,7.4-6,13.3-13.3,13.3h-80c-7.4,0-13.3-6-13.3-13.3V172
            h-13.3c-5.7,0-10.7-3.6-12.6-8.9c-1.9-5.3-0.2-11.3,4.3-14.8L247.7,95c4.9-3.9,11.8-3.9,16.7,0l66.6,53.3
            C335.4,151.8,337.1,157.8,335.2,163.1z"/>
            </svg>
`;

    res.writeHead(200, {'Content-Type': 'image/svg+xml'});
    res.write(text);
    res.end();
};
