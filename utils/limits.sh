#!/bin/sh
# Name: limits.sh
# Author: G.Zelenak
# Date: 24.03.2023
#
# Convert limit points file to JSON
# Script expects the following parameters
# -i | --input the source file
# -o | --output file without extension which is .json by default
#
# Usage
usage() {
    echo
    echo "  Usage of $(basename $0) [-h] [-i <input>] [-o [output]]"
    echo
    echo "    where"
    echo "          -h this help"
    echo "          -i <input> file of the limitpoints"
    echo "          -o <output> file converted limitpoints into a .json file"
    echo "          Please note that (extension is .json by default)"
    echo
    exit 1
}
# set -x
ARGS=$@
INPUT=
OUTPUT="limits.json"
if [ $# -eq 0 ]
then
    usage
    exit 0
fi
while getopts ':i:o:h' opt; do
    case $opt in
        (h)   usage;;
        (i)   INPUT=$OPTARG;;
        (o)   OUTPUT=$OPTARG;;
        (:)   # "optional arguments" (missing option-argument handling)
            case $OPTARG in
                (i)
                    echo ""
                    echo "    Error: required argument - see help (-h)"
                    echo ""
                    exit 1
                    ;; # error, according to our syntax
            esac;;
        (*)
            echo ""
            echo "    Error:Invalid arguments detected"
            usage
            ;;
    esac
done
shift "$OPTIND"
if [ -e $INPUT ]
then
    tempfoo=`basename $0`
    TMPFILE=`mktemp /tmp/${tempfoo}.XXXXXX` || exit 1
    # out file overwritten every times
    echo "[" > $OUTPUT
    # start the conversion
    while IFS= read -r line
    do
        # skip comments from file
        echo $line | grep -v "\-"; status=$(echo $?) 2>&1 >/dev/null
        # Check status
        if [ $status -eq 0 ]
        then
            # Split line to grab 1st and 2nd fields: id and coord string accordingly
            ID="$(echo $line | cut -d'|' -f1)" 2>&1 >/dev/null
            CSTR="$(echo $line | cut -d'|' -f2)" 2>&1 >/dev/null
            echo "{\"id\": $ID, \"coordstring\":\"$CSTR\"}," >> $OUTPUT
        fi
    done < $INPUT;
    sed -E '$s/(\{.*\}),/\1/' $OUTPUT > $TMPFILE
    echo "]" >> $TMPFILE && mv $TMPFILE $OUTPUT
fi
# set +x
