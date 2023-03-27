#!/usr/local/bin/node
// Convert SECTORS_DEFINITIONS.ASF to JSON file
const path = require('path');
const events = require('events');
const fs = require('fs');
const readline = require('readline');
const GetOptions = require('./jslib/getopts');
const options = GetOptions(process.argv.slice(2), {
    alias: {
        h: 'help',          // this help
        i: 'input',         // ASF imput file
        o: 'output'         // converted JSON file
    },
    default: {
        input: false,       // by default no input file defined
        h: true,            // for case, where no params defined at all
        o: 'output.json'    // default output file name
    }
});
const usage = () => {
    let app = path.basename(process.argv[1]);
    console.log(`Usage: ${app} [-h | --help] [-i | --input <input.ASF>] [-o | --output <output>]`);
    console.log();
    console.log(`   where`);
    console.log(`       -h | --help   this help`);
    console.log(`       -i | --input  input file`);
    console.log(`       -o | --output output file`);
    console.log();
    process.exit(0);
};
if (options.i) {
    options.h = false;
}
if (process.argv.length <= 2) {
    usage();
}
// 
fs.open(options.i, (err, fd) => {
    if (err) {
        console.error({err});
    }
    try {
        const rl = readline.createInterface({
            input: fs.createReadStream(options.i),
            output: fs.createWriteStream(options.o),
            crlfDelay: Infinity
        });
        // let output = fs.createWriteStream(options.o);
        // read line
        let num = 0;
        let level = 1;
        let layer = false;
        let volume = false;
        let sector = false;
        let fir = false;
        let lyr_bottom = 0, lyr_top, lytmp, lyr_num = 0;
        let voltmp, vol_num = 0;
        let sectmp, sect_num = 0;
        rl.on('line', (line) => {
            if (num === 0) {
                rl.output.write("{\n");
            }
            num += 1;
            line = line.replace(/\s{2,}/g, '').replace(/\s+$/g, '');
            if (!line.match(/^-/)) {
                // look for /LAYER/ first
                if (line.match(/^\/LAYER\//)) {
                    layer = true;
                    volume = false;
                    sector = false;
                    fir = false;
                    rl.output.write('   "layer":[\n');
                }
                // look for VOLUME
                if (line.match(/^\/VOLUME\//)) {
                    layer = false;
                    volume = true;
                    sector = false;
                    fir = false;
                    rl.output.write('   ],\n   "volume":[\n');
                }
                // look for SECTOR
                if (line.match(/^\/SECTOR\//)) {
                    layer = false;
                    volume = false;
                    sector = true;
                    fir = false;
                    rl.output.write('   ],\n   "sector":[\n');
                }
                // look for FIR
                if (line.match(/^\/FIR\//)) {
                    layer = false;
                    volume = false;
                    sector = false;
                    fir = true;
                    rl.output.write('   ]\n');
                }
                if (layer && !line.match(/^\/LAYER\//)) {
                    lytmp = line.replace(/\s+/g, '');
                    let [id,top,undef] = lytmp.split(/\|/);
                    if (lyr_num === 0) {
                        rl.output.write(`      {"id": ${id}, "bottom":${lyr_bottom}, "top":${parseInt(top)*100}}\n`);
                    } else {
                        rl.output.write(`      ,{"id": ${id}, "bottom":${lyr_bottom}, "top":${parseInt(top)*100}}\n`);
                    }
                    lyr_bottom = parseInt(top)*100;
                    lyr_num += 1;
                } else if (volume  && !line.match(/^\/VOLUME\//)) {
                    // console.log(`"volume": ${num}. ${line}`)
                    voltmp = line.replace(/\*/g, '').replace(/\s{2,}/g, '').replace(/\|\s/g, '|');
                    // split volume fields into values in the out put record
                    let [_id, _layer, _lpoint] = voltmp.split(/\|/);
                    let [ls, le] = _layer.split(/\-/);
                    _lpoint.replace(/\s+$/, '');
                    if (ls && le) {
                        let tmp_lyr = [];
                        for (let i = parseInt(ls); i <= parseInt(le); i += 1) {
                            tmp_lyr.push(i);
                        }
                        if (vol_num === 0) {
                            // rl.output.write(`       {"id":${_id}, "layer": [${tmp_lyr.join(',')}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                            rl.output.write(`       {"id":${_id}, "layer": [${ls}, ${le}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                        } else {
                            // rl.output.write(`       ,{"id":${_id}, "layer": [${tmp_lyr.join(',')}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                            rl.output.write(`       ,{"id":${_id}, "layer": [${ls}, ${le}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                        }
                        
                    } else {
                        if (vol_num === 0) {
                            rl.output.write(`       {"id":${_id}, "layer": [${_layer}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                        } else {
                            rl.output.write(`       ,{"id":${_id}, "layer": [${_layer}], "limit_point":[${_lpoint.split(/\s+/).join(',')}]}\n`);
                        }
                    }
                    vol_num += 1;
                    // console.log(`"volume": ${num}. ${voltmp}`)
                    // console.log({_id,_layer,_lpoint});
                } else if (sector && !line.match(/^\/SECTOR\//)) {
                    line = line.replace(/\s+/g, '').replace(/\*/g, '');
                    let [id, volume] = line.split(/\|/);
                    sectmp = volume.split(/\+/);
                    if (sect_num === 0) {
                        rl.output.write(`       {"id": "${id}", "volume": [${sectmp.length ? sectmp.join(',') : volume}]}\n`);
                    } else {
                        rl.output.write(`       ,{"id": "${id}", "volume": [${sectmp.length ? sectmp.join(',') : volume}]}\n`);
                    }
                    sect_num += 1;
                    // console.log(`"sector": ${num}. ${line}`);
                }
            }
        });
        rl.on('close', () => {
            rl.output.write('}');
            console.log(`Processing finished...`);
            fs.close(fd);
        });
    } catch (error) {
        console.error({error});
    }
});


// (async function processLineByLine() {
//   try {
//     const rl = readline.createInterface({
//       input: fs.createReadStream('broadband.sql'),
//       crlfDelay: Infinity
//     });

//     rl.on('line', (line) => {
//       console.log(`Line from file: ${line}`);
//     });

//     await events.once(rl, 'close');

//     console.log('Reading file line by line with readline done.');
//     const used = process.memoryUsage().heapUsed / 1024 / 1024;
//     console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
//   } catch (err) {
//     console.error(err);
//   }
// })();
