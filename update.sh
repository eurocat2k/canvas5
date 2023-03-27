#!/bin/sh
MSG=$1
STR=""
if [ -z $MSG ]
then
	git add . && git commit -a -m "empty message"  && git push
else
	git add . && git commit -a -m "\"${MSG}\""  && git push
fi
