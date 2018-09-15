openssl req -days 36500 -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-privatekey.pem -out localhost-certificate.pem
