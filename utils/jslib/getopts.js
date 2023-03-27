'use strict'
// implementation of class
const GetOpts = (argv = [], opts = {}) => {
    const SHORTSPLIT = /$|[!-@\[-`{-~].*/g
    const EMPTY = []
    //
    const _array = (any) => {
        return Array.isArray(any) ? any : [any]
    }
    const _aliases = (aliases) => {
        var out = {}
        for (var key in aliases) {
            var alias = (out[key] = _array(aliases[key]))
            for (var i = 0, len = alias.length; i < len; i++) {
                var curr = (out[alias[i]] = [key])
                for (var j = 0; j < len; j++) {
                    if (i !== j) {
                        curr.push(alias[j])
                    }
                }
            }
        }
        return out
    }
    const _booleans = (aliases, booleans) => {
        var out = {}
        if (booleans !== undefined) {
            for (var i = 0, len = booleans.length; i < len; i++) {
                var key = booleans[i]
                var alias = aliases[key]
                out[key] = true
                if (alias === undefined) {
                    aliases[key] = EMPTY
                } else {
                    for (var j = 0, end = alias.length; j < end; j++) {
                        out[alias[j]] = true
                    }
                }
            }
        }
        return out
    }
    const _defaults = (aliases, defaults) => {
        var out = {}
        for (var key in defaults) {
            var value = defaults[key]
            var alias = aliases[key]
            if (out[key] === undefined) {
                out[key] = value
                if (alias === undefined) {
                    aliases[key] = EMPTY
                } else {
                    for (var i = 0, len = alias.length; i < len; i++) {
                        out[alias[i]] = value
                    }
                }
            }
        }
        return out
    }
    const _set = (out, key, value, aliases, unknown) => {
        var curr = out[key]
        var alias = aliases[key]
        var known = alias !== undefined
        if (known || unknown === undefined || false !== unknown(key)) {
            if (curr === undefined) {
                out[key] = value
            } else {
                if (Array.isArray(curr)) {
                    curr.push(value)
                } else {
                    out[key] = [curr, value]
                }
            }
            if (known) {
                for (var i = 0, len = alias.length; i < len; ) {
                    out[alias[i++]] = out[key]
                }
            }
        }
    }
    // main
    var unknown = (opts = opts || {}).unknown
    var alias = _aliases(opts.alias)
    var values = _defaults(alias, opts.default)
    var bools = _booleans(alias, opts.boolean)
    var _out_dash = []
    var out = {_alist: []}
    for (var i = 0, j = 0, len = argv.length, _dash = out._alist; i < len; i++) {
        var arg = argv[i]
        if (arg === "--") {
            while (++i < len) {
                _dash.push(argv[i])
            }
        } else if (arg === "-" || arg[0] !== "-") {
            _dash.push(arg)
        } else {
            if (arg[1] === "-") {
                var end = arg.indexOf("=", 2)
                if (0 <= end) {
                    _set(out, arg.slice(2, end), arg.slice(end + 1), alias, unknown)
                } else {
                    if ("n" === arg[2] && "o" === arg[3] && "-" === arg[4]) {
                        _set(out, arg.slice(5), false, alias, unknown)
                    } else {
                        var key = arg.slice(2)
                        _set( out, key, len === (j = i + 1) || argv[j][0] === "-" || bools[key] !== undefined || argv[(i = j)], alias, unknown)
                    }
                }
            } else {
                SHORTSPLIT.lastIndex = 2
                var match = SHORTSPLIT.exec(arg)
                var end = match.index
                var value = match[0] || len === (j = i + 1) || argv[j][0] === "-" || bools[arg[end - 1]] !== undefined || argv[(i = j)]
                for (j = 1; j < end; ) {
                    _set(out, arg[j], ++j !== end || value, alias, unknown)
                }
            }
        }
    }
    for (var key in values) {
        if (out[key] === undefined) {
            out[key] = values[key]
        }
    }
    return out
}
// -----------------------------
module.exports = GetOpts