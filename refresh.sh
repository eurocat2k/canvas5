#!/bin/sh
DEFAULT_BRANCH=main
BRANCH=${DEFAULT_BRANCH}
CMD=$(basename $0)
usage(){
    cat << EOT
      
      Refresh local repository from github.
      The script optionally accepts one argument: the name of the repository barnch.
      Default branch is '${DEFAULT_BRANCH}'.

      To see what branches are valid on github, check them using 'git branch'.

      usage:
          $ ${CMD} -b [reponame]
        
        or
        
          $ ${CMD} --branch [reponame]

EOT
}

while [ $# -ge 1 ]
do
    ARG=$1
    case $ARG in
        -h | --help)
            usage
            exit 0
            ;;
        -b | --branch)
            BRANCH=$2
            if [ -z ${BRANCH} ]
            then
                cat << EOR
      
      ERROR: ${ARG} requires string parameter as the name of repository branch.

      Mandatory argument is missing. See usage (-h or --help) for further information.

EOR
                exit 1
            fi
            echo "Refreshing '${BRANCH}' ..."
            git pull origin ${BRANCH}
            exit 0
            ;;
            *)
            usage
            exit 1
            ;;
    esac
    shift
done
git pull origin ${BRANCH}