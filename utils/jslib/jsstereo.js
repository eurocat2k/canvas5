const PI          = Math.PI;
const PI_OVER_2   = (PI / 2.0);
const PI_OVER_4   = (PI / 4.0);
const TWO_PI      = (2.0 * PI);
const ONE         = (1.0 * PI / 180.0);
const SYS_CENTER_LON = 19.2322222222222;
const SYS_CENTER_LAT = 47.4452777777778;
const sin = Math.sin;
const cos = Math.cos;
const atan = Math.atan;
const atan2 = Math.atan2;
const asin = Math.asin;
const acos = Math.acos;
const tan = Math.tan;
const abs = Math.abs;
const sqrt = Math.sqrt;
// 
module.exports = class jsStereo {
    constructor(params) {
        let self = this
        this.defaults = {
            'SYS_CENTER_LON': SYS_CENTER_LON,
            'SYS_CENTER_LAT': SYS_CENTER_LAT,
            'PI': undefined,
            'PI_OVER_2': undefined,
            'TWO_PI': undefined,
            'ONE': undefined,
            'Stereo_a': undefined,
            'Stereo_f': undefined,
            'Stereo_Ra': undefined,
            'Two_Stereo_Ra': undefined,
            'Stereo_At_Pole': undefined,
            'Stereo_Origin_Lat': undefined,
            'Stereo_Origin_Long': undefined,
            'Stereo_False_Easting': undefined,
            'Stereo_False_Northing': undefined,
            'Sin_Stereo_Origin_Lat': undefined,
            'Cos_Stereo_Origin_Lat': undefined,
            'Stereo_Delta_Easting': undefined,
            'Stereo_Delta_Northing': undefined
        }
        this.results = {
            'EASTING': undefined,
            'NORTHING': undefined,
            'LAT': undefined,
            'LON': undefined
        }
        // console.log({jsStereoParams: params})
        if (typeof params === 'undefined') {
            self.defaults = {
                'SYS_CENTER_LON': SYS_CENTER_LON,
                'SYS_CENTER_LAT': SYS_CENTER_LAT,
                'PI': undefined,
                'PI_OVER_2': undefined,
                'TWO_PI': undefined,
                'ONE': undefined,
                'Stereo_a': undefined,
                'Stereo_f': undefined,
                'Stereo_Ra': undefined,
                'Two_Stereo_Ra': undefined,
                'Stereo_At_Pole': undefined,
                'Stereo_Origin_Lat': undefined,
                'Stereo_Origin_Long': undefined,
                'Stereo_False_Easting': undefined,
                'Stereo_False_Northing': undefined,
                'Sin_Stereo_Origin_Lat': undefined,
                'Cos_Stereo_Origin_Lat': undefined,
                'Stereo_Delta_Easting': undefined,
                'Stereo_Delta_Northing': undefined
            }
            self.results = {
                'EASTING': undefined,
                'NORTHING': undefined,
                'LAT': undefined,
                'LON': undefined
            }
            self.init(self.defaults.SYS_CENTER_LAT, self.defaults.SYS_CENTER_LON)
        } else {
            for (var i in params) {
                // console.log({i, value: params[i], defaults: self.defaults[i]})
                self.defaults[i] = (typeof(params[i])) ? params[i] : self.defaults[i]
            }
            if (self.defaults.Stereo_Origin_Lat && self.defaults.Stereo_Origin_Long){
                self.init(self.defaults.Stereo_Origin_Lat, self.defaults.Stereo_Origin_Long)
            } else {
                self.init(self.defaults.SYS_CENTER_LAT, self.defaults.SYS_CENTER_LON)
            }
        }
    }
    init(clat=SYS_CENTER_LAT, clon=SYS_CENTER_LON) {
        var self = this
        var originLat = SYS_CENTER_LAT * ONE
        var originLon = SYS_CENTER_LON * ONE

        if (typeof clat !== 'undefined'){
            originLat = clat * ONE
        }
        if (typeof clon !== 'undefined'){
            originLon = clon * ONE
        }
        //console.log(originLat, originLon)
        self.defaults.PI = PI
        self.defaults.PI_OVER_2 = (PI / 2.0)
        self.defaults.PI_OVER_4 = (PI / 4.0)
        self.defaults.TWO_PI = (2.0 * PI)
        self.defaults.ONE = (1.0 * PI / 180.0)
        self.defaults.Stereo_a = 6378137.0
        self.defaults.Stereo_f = 1 / 298.257223563
        self.defaults.Stereo_Ra = 6371007.1810824
        self.defaults.Two_Stereo_Ra = 12742014.3621648
        self.defaults.Stereo_At_Pole = 0
        self.defaults.Stereo_Origin_Lat = originLat
        self.defaults.Stereo_Origin_Long = originLon
        self.defaults.Stereo_False_Easting = 0.0
        self.defaults.Stereo_False_Northing = 0.0
        self.defaults.Sin_Stereo_Origin_Lat = 0.0
        self.defaults.Cos_Stereo_Origin_Lat = 1.0
        self.defaults.Stereo_Delta_Easting = 1460090226.0
        self.defaults.Stereo_Delta_Northing = 1460090226.0
        self.results.EASTING = undefined
        self.results.NORTHING = undefined
        self.results.LAT = undefined
        self.results.LON = undefined
        //console.log(self.defaults)
        self.Set_Stereographic_Parameters(
            self.defaults.Stereo_a,
            self.defaults.Stereo_f,
            originLat,
            originLon,
            self.defaults.Stereo_False_Easting,
            self.defaults.Stereo_False_Northing
        )
    }
    Set_Stereographic_Parameters(a, f, Origin_Latitude, Central_Meridian, False_Easting, False_Northing) {
        var self = this
        var CLAT, CLON
        var es2, es4, es6
        var temp = 0.0
        var inv_f = 1.0 / f
        var error = 0


        if ((typeof Origin_Latitude === 'undefined') && (typeof Central_Meridian === 'undefined')){
            console.log('CLAT CLON is missing')
            return -1
        }
        if (a <= 0.0){
            // Semi-major axis must be greater than zero
            console.log('Semi-major axis must be greater than zero')
            error = -1
        }
        if ((inv_f < 250) || (inv_f > 350)) {
            // Inverse flattening must be between 250 and 350
            console.log('Inverse flattening must be between 250 and 350')
            error = -2
        }

        //CLAT = Origin_Latitude * ONE
        //CLON = Central_Meridian * ONE
        CLAT = Origin_Latitude
        CLON = Central_Meridian
        //console.log('self.defaults = '+self.defaults)
        if ((CLAT < -1.0 * PI_OVER_2) || (CLAT > PI_OVER_2)) {
            // origin latitude out of range
            console.log('origin latitude out of range')
            error = -3
        }
        if ((CLON < -1.0 * PI) || (CLON > TWO_PI)) {
            // origin longitude out of range
            console.log('origin longitude out of range')
            error = -4
        }
        if (!error) {
            // no errors
            self.defaults.Stereo_a = a
            self.defaults.Stereo_f = f
            es2 = 2 * self.defaults.Stereo_f - self.defaults.Stereo_f * self.defaults.Stereo_f
            es4 = es2 * es2
            es6 = es4 * es2
            self.defaults.Stereo_Ra = self.defaults.Stereo_a * (1.0 - es2 / 6.0 - 17.0 * es4 / 360.0 - 67.0 * es6 / 3024.0)
            self.defaults.Two_Stereo_Ra = 2.0 * self.defaults.Stereo_Ra
            //self.defaults.Stereo_Origin_Lat = Origin_Latitude
            self.defaults.Stereo_Origin_Lat = CLAT
            self.defaults.Sin_Stereo_Origin_Lat = sin(self.defaults.Stereo_Origin_Lat)
            self.defaults.Cos_Stereo_Origin_Lat = cos(self.defaults.Stereo_Origin_Lat)
            if (CLON > PI){
                CLON -= TWO_PI
            }
            self.defaults.Stereo_Origin_Long = CLON
            self.defaults.Stereo_False_Easting = False_Easting
            self.defaults.Stereo_False_Northing = False_Northing
            if(abs(abs(self.defaults.Stereo_Origin_Lat) - PI_OVER_2) < 1.0E-10){
                self.defaults.Stereo_At_Pole = 1
            } else {
                self.defaults.Stereo_At_Pole = 0
            }

            if ((self.defaults.Stereo_At_Pole) || (abs(self.defaults.Stereo_Origin_Lat) < 1.0E-10)){
                self.defaults.Stereo_Delta_Easting = 1460090226.0
            } else {
                if (self.defaults.Stereo_Origin_Long <= 0){
                    // my ($Stereo_Delta_Easting, $temp) = $self->Convert_Geodetic_To_Stereographic(-1.0 * self.defaults.Stereo_Origin_Lat}, PI + self.defaults.Stereo_Origin_Long} - ONE)
                    var Stereo_Delta_Easting = self.Convert_Geodetic_To_Stereographic(-1.0 * self.defaults.Stereo_Origin_Lat, PI + self.defaults.Stereo_Origin_Long - ONE)
                } else {
                    //my ($Stereo_Delta_Easting, $temp) = $self->Convert_Geodetic_To_Stereographic(-1.0 * self.defaults.Stereo_Origin_Lat}, self.defaults.Stereo_Origin_Long} - PI - ONE)
                    var Stereo_Delta_Easting = self.Convert_Geodetic_To_Stereographic(-1.0 * self.defaults.Stereo_Origin_Lat, self.defaults.Stereo_Origin_Long - PI - ONE)
                }
                if(self.defaults.Stereo_False_Easting){
                    self.defaults.Stereo_Delta_Easting -= self.defaults.Stereo_False_Easting
                }
                if (self.defaults.Stereo_Delta_Easting < 0){
                    self.defaults.Stereo_Delta_Easting = -1.0 * self.defaults.Stereo_Delta_Easting
                }
            }
        }
        // END OF if(!Error_Code)
        return error
    }
    Convert_Geodetic_To_Stereographic(Latitude, Longitude) {
        var self = this
        var g, k
        var num = 0
        var Ra_k = 0
        var lat, lon
        var slat = sin(Latitude)
        var clat = cos(Latitude)
        var dlam
        var cos_dlam
        var Error_Code = 0

        var Easting = undefined
        var Northing = undefined
        self.results.EASTING = Easting
        self.results.NORTHING = Northing

        if ((Latitude < -1.0 * PI_OVER_2) || (Latitude > PI_OVER_2)){
            // Latitude out of range
            console.log('Latitude out of range')
            Error_Code |= -1
        }
        if ((Longitude < -1.0 * PI) || (Longitude > TWO_PI)){
            // Longitude out of range
            console.log('Longitude out of range')
            Error_Code |= -2
        }
        if (!(Error_Code)){
            // no errors
            dlam = Longitude - self.defaults.Stereo_Origin_Long
            //console.log('dlam = ' + dlam)
            if (dlam > PI){
                dlam -= TWO_PI
            }
            if (dlam < -1.0 * PI){
                dlam += TWO_PI
            }
            cos_dlam = cos(dlam)
            g = 1.0 + self.defaults.Sin_Stereo_Origin_Lat * slat + self.defaults.Cos_Stereo_Origin_Lat * clat * cos_dlam
            if (abs(g) <= 1.0 - 10.0){
                // Point is out of view.  Will return longitude out of range message
                // since no point out of view is implemented.
                Error_Code |= -3
            } else {
                if (self.defaults.Stereo_At_Pole){
                    if (abs(abs(Latitude) - PI_OVER_2) < 1.0E-10){
                        Easting = self.defaults.Stereo_False_Easting
                        Northing = self.defaults.Stereo_False_Northing
                    } else {
                        if (self.defaults.Stereo_Origin_Lat > 0.0){
                            num = self.defaults.Two_Stereo_Ra * tan(PI_OVER_4 - Latitude / 2.0)
                            Easting = self.defaults.Stereo_False_Easting + num * sin(dlam)
                            Northing = self.defaults.Stereo_False_Northing + (-1.0 * num * cos_dlam)
                        } else {
                            num = self.defaults.Two_Stereo_Ra * tan(PI_OVER_4 + Latitude / 2.0)
                            Easting = self.defaults.Stereo_False_Easting + num * sin(dlam)
                            Northing = self.defaults.Stereo_False_Northing + num * cos_dlam
                        }
                    }
                } else {
                    if (abs(self.defaults.Stereo_Origin_Lat) <= 1.0E-10){
                        k = 2.0 / (1.0 + clat * cos_dlam)
                        Ra_k = self.defaults.Stereo_Ra * k
                        Northing = self.defaults.Stereo_False_Northing + Ra_k * slat
                    } else {
                        k = 2.0 / g
                        Ra_k = self.defaults.Stereo_Ra * k
                        Northing = self.defaults.Stereo_False_Northing + Ra_k * (self.defaults.Cos_Stereo_Origin_Lat * slat - self.defaults.Sin_Stereo_Origin_Lat * clat * cos_dlam)
                    }
                    Easting = self.defaults.Stereo_False_Easting + Ra_k * clat * sin(dlam)
                }
            }
        }
        self.results.EASTING = Easting
        self.results.NORTHING = Northing
        //#print "easting = $Easting northing = $Northing\n"
        return Error_Code
    }
    forward(Latitude, Longitude) {
        var self = this
        var x, y
        self.Convert_Geodetic_To_Stereographic(Latitude * ONE, Longitude * ONE)
        if ((typeof self.results.EASTING) && (typeof self.results.NORTHING)){
            x = self.results.EASTING
            y = self.results.NORTHING
        } else {
            x = y = undefined
        }
        return { 'x': x, 'y': y }
    }
    Convert_Stereographic_To_Geodetic(E, N) {
        var self = this
        var dx, dy
        var rho, c
        var sin_c, cos_c
        var dy_sin_c
        var Error_Code = 0
        var Latitude, Longitude

        if ((E < (self.defaults.Stereo_False_Easting - self.defaults.Stereo_Delta_Easting)) || (E > (self.defaults.Stereo_False_Easting + self.defaults.Stereo_Delta_Easting))) {
            // Easting out of range
            console.log('Easting out of range')
            Error_Code |= -1
        }
        if ((N < (self.defaults.Stereo_False_Northing - self.defaults.Stereo_Delta_Northing)) || (N > (self.defaults.Stereo_False_Northing + self.defaults.Stereo_Delta_Northing))){
            // Northing out of range
            Error_Code |= -2
        }
        if (!Error_Code){
            // no errors
            dy = N - self.defaults.Stereo_False_Northing
            dx = E - self.defaults.Stereo_False_Easting
            rho = sqrt(dx * dx + dy * dy)
            if (abs(rho) <= 1.0E-10){
                Latitude = self.defaults.Stereo_Origin_Lat
                Longitude = self.defaults.Stereo_Origin_Long
            } else {
                c = 2.0 * atan(rho / (self.defaults.Two_Stereo_Ra))
                sin_c = sin(c)
                cos_c = cos(c)
                dy_sin_c = dy * sin_c
                if (self.defaults.Stereo_At_Pole){
                    if (self.defaults.Stereo_Origin_Lat > 0){
                        Longitude = self.defaults.Stereo_Origin_Long + atan2(dx, -1.0 * dy)
                    } else {
                        Longitude = self.defaults.Stereo_Origin_Long + atan2(dx, dy)
                    }
                } else {
                    Longitude = self.defaults.Stereo_Origin_Long + atan2(dx * sin_c, (rho * self.defaults.Cos_Stereo_Origin_Lat * cos_c - dy_sin_c * self.defaults.Sin_Stereo_Origin_Lat))
                }
                Latitude = asin(cos_c * self.defaults.Sin_Stereo_Origin_Lat + ((dy_sin_c * self.defaults.Cos_Stereo_Origin_Lat) / rho))
            }
            if (abs(Latitude) < 2.2E-8){
                // force lat to 0 to avoid -0 degrees
                Latitude = 0.0
            }
            if (Latitude > PI_OVER_2){
                // force distorted values to 90, -90 degrees
                Latitude = PI_OVER_2
            } else if (Latitude < -1.0 * PI_OVER_2) {
                Latitude = -1.0 * PI_OVER_2
            }
            if (Longitude > PI){
                if (Longitude - PI < 3.5E-6){
                    Longitude = PI
                } else {
                    Longitude -= TWO_PI
                }
            }
            if (Longitude < -1.0 * PI){
                if (abs(Longitude + PI) < 3.5E-6){
                    Longitude = -1.0 * PI
                } else {
                    Longitude += TWO_PI
                }
            }
            if (abs(Longitude) < 2.0E-7){
                // force lon to 0 to avoid -0 degrees
                Longitude = 0.0
            }

            if (Longitude > PI){
                // force distorted values to 180, -180 degrees
                Longitude = PI
            } else {
                if (Longitude < -1.0 * PI) {
                    Longitude = -1.0 * PI
                }
            }
            self.results.LAT = Latitude
            self.results.LON = Longitude
        }
        return Error_Code
    }
    inverse(E, N) {
        var self = this
	    var lon, lat
	    self.Convert_Stereographic_To_Geodetic(E, N)
	    if ((typeof self.results.LAT === 'undefined') || (typeof self.results.LON === 'undefined')){
		    return {'lat': undefined, 'lon': undefined }
	    }
	    lon = self.results.LON / ONE
	    lat = self.results.LAT / ONE
	    return {'lat': lat, 'lon': lon }
    }
}