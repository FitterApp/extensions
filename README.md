## Https
### 🔧 1. Install mkcert:
#### macOS
```
brew install mkcert
brew install nss # if using Firefox
```

#### Ubuntu/Debian
```
sudo apt install libnss3-tools
curl -JLO https://dl.filippo.io/mkcert/latest?for=linux/amd64
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

### 🔧 2. Create trusted certs:
Run following folder in the current folder (/extensions)

```
mkcert -install
mkcert localhost 127.0.0.1 ::1
```
