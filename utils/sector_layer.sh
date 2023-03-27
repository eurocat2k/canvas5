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
    echo "          -i <input> file of the sectors definitions"
    echo "          -o <output> file converted sectors into a .json file"
    echo "          Please note that (extension is .json by default)"
    echo
    exit 1
}
# set -x
ARGS=$@
INPUT=
OUTPUT="sector.json"
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
    LAYER=0
    VOLUME=0
    SECTOR=0
    tempfoo=`basename $0`
    TMPFILE=`mktemp /tmp/${tempfoo}.XXXXXX` || exit 1
    # out file overwritten every times
    echo "[" > $OUTPUT
    # start the conversion
    while read line
    do
        echo $line
    done < $INPUT;
    sed -E '$s/(\{.*\}),/\1/' $OUTPUT > $TMPFILE
    echo "]" >> $TMPFILE && mv $TMPFILE $OUTPUT
fi