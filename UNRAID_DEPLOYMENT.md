# 🌶️ Chili Cookoff Voting App - Unraid Deployment Guide

This guide shows how to deploy your Chili Cookoff Voting application on Unraid using the built-in "Add Container" GUI.

## 🎯 Quick Setup Summary

- **Network**: Use existing `bond0` network (10.69.50.0/24) 
- **IP Address**: Configurable (e.g., 10.69.50.100 or next available)
- **Port**: 3005
- **Data Storage**: `/mnt/pool/appdata/chili-voting/`
- **Access**: http://YOUR_CHOSEN_IP:3005

## 📋 Prerequisites

1. **Build & Push Docker Image**:
   ```bash
   # Update Docker Hub username in build-docker.sh first
   chmod +x build-docker.sh
   ./build-docker.sh
   
   # Push to Docker Hub (uncomment push lines in script)
   docker push your-username/chili-voting-app:latest
   ```

2. **Create Data Directory on Unraid**:
   ```bash
   mkdir -p /mnt/pool/appdata/chili-voting
   chmod 755 /mnt/pool/appdata/chili-voting
   ```

## 🐳 Unraid Container Configuration

### Basic Settings
- **Name**: `chili-voting-app`
- **Repository**: `sadeghhajiazimi641/chili-voting-app:latest`
- **Docker Hub URL**: `https://hub.docker.com/r/sadeghhajiazimi641/chili-voting-app`
- **Icon URL**: `https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/chili.svg`

### Network Settings
- **Network Type**: `Custom : bond0`
- **Fixed IP address**: `10.69.50.XXX` (choose any available IP in your network range)
- **Port Mappings**: 
  - Container Port: `3005`
  - Host Port: `3005`
  - Connection Type: `TCP`

### Path Mappings
| Container Path | Host Path | Access Mode | Description |
|---------------|-----------|-------------|-------------|
| `/app/data` | `/mnt/pool/appdata/chili-voting` | `Read/Write` | SQLite Database Storage |

### Environment Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production environment |
| `DOCKER` | `true` | Enable Docker mode |
| `APP_URL` | `http://YOUR_IP:3005` | Full URL for the app (optional - auto-detected if not set) |
| `PORT` | `3005` | Port number (optional - defaults to 3005) |
| `PUID` | `1001` | User ID for file permissions |
| `PGID` | `1001` | Group ID for file permissions |

> **Note**: The `APP_URL` is automatically detected from the client's browser, so you don't need to set it unless you have specific requirements.

### Advanced Settings
- **Privileged**: `No` (disable)
- **Console shell command**: `sh`
- **CPU pinning**: `(leave empty)`
- **Memory limit**: `512MB` (optional)

## 🌐 Network Access Configuration

Since your WiFi network (10.69.50.0/24) matches the `bond0` network, devices on your WiFi will be able to directly access the application at:

**http://YOUR_CHOSEN_IP:3005** (e.g., http://10.69.50.100:3005)

The application automatically detects the IP address from the browser, so you just need to:
1. Choose any available IP in the 10.69.50.0/24 range when setting up the container
2. Access the app using that IP from any WiFi device

### Verify Network Connectivity

1. **From Unraid console**:
   ```bash
   ping YOUR_CHOSEN_IP
   curl http://YOUR_CHOSEN_IP:3005/health
   ```

2. **From WiFi device**:
   - Open browser: `http://YOUR_CHOSEN_IP:3005`
   - Should show the Chili Cookoff Voting interface

## 🔧 Container Template (XML)

For advanced users, here's the complete Unraid template:

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>chili-voting-app</Name>
  <Repository>sadeghhajiazimi641/chili-voting-app:latest</Repository>
  <Registry>https://hub.docker.com/r/sadeghhajiazimi641/chili-voting-app</Registry>
  <Network>bond0</Network>
  <MyIP>10.69.50.XXX</MyIP>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/sadeghhajiazimi641/chili-voting-app</Support>
  <Project>https://github.com/sadeghhajiazimi641/chili-voting-app</Project>
  <Overview>Chili Cook-Off Voting System with Vue.js frontend and Express backend. SQLite database for data persistence.</Overview>
  <Category>HomeAutomation:</Category>
  <WebUI>http://[IP]:[PORT:3005]</WebUI>
  <TemplateURL></TemplateURL>
  <Icon>https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/chili.svg</Icon>
  <ExtraParams></ExtraParams>
  <PostArgs></PostArgs>
  <CPUset></CPUset>
  <DateInstalled></DateInstalled>
  <DonateText></DonateText>
  <DonateLink></DonateLink>
  <Description>Chili Cook-Off Voting System</Description>
  <Networking>
    <Mode>bond0</Mode>
    <Publish>
      <Port>
        <HostPort>3005</HostPort>
        <ContainerPort>3005</ContainerPort>
        <Protocol>tcp</Protocol>
      </Port>
    </Publish>
  </Networking>
  <Data>
    <Volume>
      <HostDir>/mnt/pool/appdata/chili-voting</HostDir>
      <ContainerDir>/app/data</ContainerDir>
      <Mode>rw</Mode>
    </Volume>
  </Data>
  <Environment>
    <Variable>
      <Value>production</Value>
      <Name>NODE_ENV</Name>
      <Mode></Mode>
    </Variable>
    <Variable>
      <Value>true</Value>
      <Name>DOCKER</Name>
      <Mode></Mode>
    </Variable>
    <Variable>
      <Value>1001</Value>
      <Name>PUID</Name>
      <Mode></Mode>
    </Variable>
    <Variable>
      <Value>1001</Value>
      <Name>PGID</Name>
      <Mode></Mode>
    </Variable>
  </Environment>
  <Labels/>
  <Config Name="Data Storage" Target="/app/data" Default="/mnt/pool/appdata/chili-voting" Mode="rw" Description="SQLite database storage" Type="Path" Display="always" Required="true" Mask="false">/mnt/pool/appdata/chili-voting</Config>
  <Config Name="Web Port" Target="3005" Default="3005" Mode="tcp" Description="Web interface port" Type="Port" Display="always" Required="true" Mask="false">3005</Config>
  <Config Name="NODE_ENV" Target="NODE_ENV" Default="production" Mode="" Description="Node environment" Type="Variable" Display="always" Required="true" Mask="false">production</Config>
  <Config Name="DOCKER" Target="DOCKER" Default="true" Mode="" Description="Docker mode flag" Type="Variable" Display="always" Required="true" Mask="false">true</Config>
</Container>
```

## 🚀 Deployment Steps

1. **Open Unraid WebUI** → **Docker** tab → **Add Container**

2. **Fill in the configuration** using the values above

3. **Click Apply** to create and start the container

4. **Verify deployment**:
   - Check container logs for successful startup
   - Visit http://YOUR_CHOSEN_IP:3005 from WiFi device
   - Test the health endpoint: http://YOUR_CHOSEN_IP:3005/health

## 🔍 Troubleshooting

### Container won't start
```bash
# Check container logs
docker logs chili-voting-app

# Check if port is available
netstat -tlnp | grep 3005
```

### Can't access from WiFi
```bash
# Verify IP assignment
docker inspect chili-voting-app | grep IPAddress

# Test from Unraid server (replace with your chosen IP)
curl -v http://YOUR_CHOSEN_IP:3005/health
```

### Database issues
```bash
# Check data directory permissions
ls -la /mnt/pool/appdata/chili-voting/

# Check if database file was created
ls -la /mnt/pool/appdata/chili-voting/chili-cookoff.db*
```

## 📱 Usage

Once deployed, users on your WiFi network can:

1. **Access the application**: http://YOUR_CHOSEN_IP:3005
2. **Admin Panel**: Add/manage chili entries
3. **Judge Scoring**: Score chilis on 5 categories (50 points max)
4. **Public Voting**: Attendees vote for top 3 favorites
5. **Results**: View final scores with bonus points

All data persists in the SQLite database stored in `/mnt/pool/appdata/chili-voting/`.

## 🔄 Updates

To update the application:

1. Build and push new image version
2. In Unraid: **Docker** → **chili-voting-app** → **Force Update**
3. Container will restart with the new version

The database will persist through updates since it's stored in the mapped volume.