#!/bin/sh

echo -n "Check if the admin password is valid... "
(echo $GF_SECURITY_ADMIN_PASSWORD |/bin/grep -P '^((?=[!-~A-Za-z0-9]{0,}[A-Z])(?=[!-~A-Za-z0-9]{0,}[a-z])(?=[!-~A-Za-z0-9]{0,}[0-9])(?=[!-~A-Za-z0-9]{0,}[\!-\/\:-\@\[-\`\{-\~])[!-~A-Za-z0-9]{8,})$' > /dev/null) && export res=OK || export res=KO
echo $res
(echo $res |/bin/grep OK > /dev/null) || exit 1

exec /run.sh $@
