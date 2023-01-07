
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = require("cross-fetch");
const URL  = require('url').URL;

class NominatimJS {
    static search(params) {
        params.format = params.format || 'json';
        if (params.countryCodesArray) {
            params.countrycodes = params.countryCodesArray.join(',');
        }
        if (params.accept_language) {
            params['accept-language'] = params.accept_language;
        }
        const myurl = new URL('https://nominatim.openstreetmap.org/search');
         
        Object.keys(params).forEach(key => myurl.searchParams.append(key, params[key]));
        return cross_fetch_1.default(myurl.toJSON())
            .then(res => res.json());
    }
}

exports.NominatimJS = NominatimJS;
// # sourceMappingURL=nominatim-js.js.map