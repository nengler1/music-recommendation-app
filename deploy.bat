scp html/* root@melofy.apps.dj:/var/www/html/
scp jsapp/* root@melofy.apps.dj:/var/www/jsapp/
ssh root@melofy.apps.dj systemctl restart jsapp
