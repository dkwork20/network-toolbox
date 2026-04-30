export const languages = [
	{ id: "auto", label: "Auto-detect", ext: "" },
	{ id: "markdown", label: "Markdown", ext: "md" },
	{ id: "html", label: "HTML", ext: "html" },
	{ id: "css", label: "CSS", ext: "css" },
	{ id: "json", label: "JSON", ext: "json" },
	{ id: "yaml", label: "YAML", ext: "yaml" },
	{ id: "javascript", label: "JavaScript", ext: "js" },
	{ id: "typescript", label: "TypeScript", ext: "ts" },
	{ id: "python", label: "Python", ext: "py" },
	{ id: "csharp", label: "C#", ext: "cs" },
	{ id: "java", label: "Java", ext: "java" },
	{ id: "php", label: "PHP", ext: "php" },
	{ id: "sql", label: "SQL", ext: "sql" },
	{ id: "bash", label: "Shell/Bash", ext: "sh" },
	{ id: "xml", label: "XML", ext: "xml" },
	{ id: "toml", label: "TOML", ext: "toml" },
	{ id: "rust", label: "Rust", ext: "rs" },
	{ id: "go", label: "Go", ext: "go" },
	{ id: "cpp", label: "C++", ext: "cpp" },
	{ id: "ruby", label: "Ruby", ext: "rb" },
];

export const sampleContents: Record<string, string> = {
	markdown: `# NetOps Solutions

Your all-in-one toolkit for **Network Operations**, *Development*, and **Security**.

## Features

- 🔧 **Network Tools**: IP Calculator, Subnet Visualizer, DNS Lookup
- 🔐 **Security**: Password Generator, Log Sanitizer
- 💻 **Developer Tools**: JWT Debugger, Timestamp, Cron Generator

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## API Reference

| Tool | Route | Description |
|------|-------|-------------|
| IP Calculator | /tools/ip | CIDR calculations |
| DNS Lookup | /tools/dns | DoH record query |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

> **Note**: All tools run client-side for privacy.

---

Made with ❤️ by the NetOps team`,

	json: `{
  "name": "netops-solutions",
  "version": "0.10.0",
  "description": "Privacy-focused network toolkit",
  "tools": [
    {
      "id": "ip-calculator",
      "name": "IP Calculator",
      "category": "network",
      "features": ["ipv4", "ipv6", "cidr"]
    },
    {
      "id": "dns-lookup",
      "name": "DNS Lookup",
      "category": "network",
      "features": ["doh", "records"]
    }
  ],
  "config": {
    "theme": "dark",
    "maxHistory": 50,
    "enableAnalytics": false
  }
}`,

	html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NetOps Dashboard</title>
  <style>
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  </style>
</head>
<body>
  <header class="header">
    <nav class="container">
      <h1>NetOps Solutions</h1>
      <ul>
        <li><a href="/tools">Tools</a></li>
        <li><a href="/docs">Documentation</a></li>
      </ul>
    </nav>
  </header>
  <main class="container">
    <section id="tools">
      <h2>Available Tools</h2>
      <div class="tool-grid">
        <article class="tool-card">
          <h3>IP Calculator</h3>
          <p>Calculate subnets and IP ranges</p>
        </article>
      </div>
    </section>
  </main>
</body>
</html>`,

	css: `/* NetOps Solutions - Main Stylesheet */

:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-dark: #0f172a;
  --text-primary: #f1f5f9;
  --border-radius: 8px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--background-dark);
  color: var(--text-primary);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.tool-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
}`,

	yaml: `# NetOps Solutions Configuration
name: netops-solutions
version: 0.10.0
description: Privacy-focused network toolkit

server:
  host: 0.0.0.0
  port: 5770
  workers: 4

database:
  type: sqlite
  path: ./data/netops.db
  pool_size: 10

tools:
  network:
    - name: ip-calculator
      enabled: true
      route: /tools/ip
    - name: dns-lookup
      enabled: true
      route: /tools/dns
    - name: subnet-visualizer
      enabled: true
      route: /tools/subnet

  security:
    - name: password-generator
      enabled: true
      route: /tools/password
    - name: log-sanitizer
      enabled: true
      route: /tools/sanitizer

logging:
  level: info
  format: json
  output: stdout`,

	javascript: `// NetOps Solutions - Tool Registry
const toolRegistry = {
  tools: new Map(),
  
  register(id, config) {
    if (this.tools.has(id)) {
      console.warn(\`Tool \${id} already registered\`);
      return false;
    }
    
    this.tools.set(id, {
      ...config,
      registeredAt: new Date().toISOString()
    });
    
    return true;
  },
  
  get(id) {
    return this.tools.get(id);
  },
  
  getByCategory(category) {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category);
  }
};

// Register network tools
toolRegistry.register('ip-calculator', {
  name: 'IP Calculator',
  category: 'network',
  description: 'Calculate subnets and IP ranges',
  features: ['ipv4', 'ipv6', 'cidr'],
  handler: async (input) => {
    const { ip, cidr } = input;
    return calculateSubnet(ip, cidr);
  }
});

export default toolRegistry;`,

	typescript: `// NetOps Solutions - Type Definitions

interface ToolConfig {
  id: string;
  name: string;
  category: 'network' | 'security' | 'developer' | 'encoding';
  description: string;
  features: string[];
  handler: (input: unknown) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface IPRange {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
}

type IPVersion = 'ipv4' | 'ipv6';

class ToolRegistry {
  private tools: Map<string, ToolConfig> = new Map();
  
  register(config: ToolConfig): boolean {
    if (this.tools.has(config.id)) {
      console.warn(\`Tool \${config.id} already registered\`);
      return false;
    }
    this.tools.set(config.id, config);
    return true;
  }
  
  get(id: string): ToolConfig | undefined {
    return this.tools.get(id);
  }
  
  getByCategory(category: ToolConfig['category']): ToolConfig[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category);
  }
}

export { ToolRegistry, type ToolConfig, type ToolResult, type IPRange };`,

	python: `#!/usr/bin/env python3
"""NetOps Solutions - Network Utilities"""

import ipaddress
from dataclasses import dataclass
from typing import Optional, List

@dataclass
class SubnetInfo:
    """Subnet information container"""
    network: str
    broadcast: str
    first_host: str
    last_host: str
    total_hosts: int

def calculate_subnet(ip: str, cidr: int) -> Optional[SubnetInfo]:
    """Calculate subnet information for given IP and CIDR.
    
    Args:
        ip: IP address string (IPv4 or IPv6)
        cidr: Network prefix length
        
    Returns:
        SubnetInfo object or None if invalid input
    """
    try:
        network = ipaddress.ip_network(f"{ip}/{cidr}", strict=False)
        hosts = list(network.hosts())
        
        return SubnetInfo(
            network=str(network.network_address),
            broadcast=str(network.broadcast_address),
            first_host=str(hosts[0]) if hosts else str(network.network_address),
            last_host=str(hosts[-1]) if hosts else str(network.broadcast_address),
            total_hosts=max(0, network.num_addresses - 2)
        )
    except ValueError as e:
        print(f"Error calculating subnet: {e}")
        return None

if __name__ == "__main__":
    info = calculate_subnet("192.168.1.0", 24)
    print(f"Network: {info.network}")
    print(f"Total hosts: {info.total_hosts}")`,

	csharp: `using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;

namespace NetOpsSolutions.Tools
{
    /// <summary>
    /// IP Calculator tool for subnet calculations
    /// </summary>
    public class IpCalculator : ITool
    {
        public string Id => "ip-calculator";
        public string Name => "IP Calculator";
        public string Category => "network";
        
        public async Task<ToolResult> ExecuteAsync(Dictionary<string, object> input)
        {
            var ip = input["ip"]?.ToString();
            var cidr = Convert.ToInt32(input["cidr"]);
            
            try
            {
                var network = IPNetwork.Parse($"{ip}/{cidr}");
                var result = new SubnetInfo
                {
                    Network = network.NetworkAddress.ToString(),
                    Broadcast = network.BroadcastAddress.ToString(),
                    TotalHosts = network.Total - 2
                };
                
                return ToolResult.Success(result);
            }
            catch (Exception ex)
            {
                return ToolResult.Error(ex.Message);
            }
        }
    }
    
    public class SubnetInfo
    {
        public string Network { get; set; }
        public string Broadcast { get; set; }
        public long TotalHosts { get; set; }
    }
}`,

	java: `package com.netops.tools;

import java.util.HashMap;
import java.util.Map;

/**
 * IP Calculator tool for subnet calculations
 */
public class IpCalculator implements Tool {
    
    private static final String TOOL_ID = "ip-calculator";
    private static final String TOOL_NAME = "IP Calculator";
    
    @Override
    public String getId() {
        return TOOL_ID;
    }
    
    @Override
    public String getName() {
        return TOOL_NAME;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> input) {
        String ip = (String) input.get("ip");
        Integer cidr = (Integer) input.get("cidr");
        
        try {
            SubnetInfo info = calculateSubnet(ip, cidr);
            return ToolResult.success(info);
        } catch (Exception e) {
            return ToolResult.error(e.getMessage());
        }
    }
    
    private SubnetInfo calculateSubnet(String ip, int cidr) {
        // Implementation details
        SubnetInfo info = new SubnetInfo();
        info.setNetwork(ip);
        info.setCidr(cidr);
        return info;
    }
    
    public static void main(String[] args) {
        IpCalculator calc = new IpCalculator();
        Map<String, Object> input = new HashMap<>();
        input.put("ip", "192.168.1.0");
        input.put("cidr", 24);
        
        ToolResult result = calc.execute(input);
        System.out.println(result);
    }
}`,

	php: `<?php

namespace NetOps\\Tools;

/**
 * IP Calculator tool for subnet calculations
 */
class IpCalculator implements ToolInterface
{
    private const TOOL_ID = 'ip-calculator';
    private const TOOL_NAME = 'IP Calculator';
    
    public function getId(): string
    {
        return self::TOOL_ID;
    }
    
    public function getName(): string
    {
        return self::TOOL_NAME;
    }
    
    public function execute(array $input): ToolResult
    {
        $ip = $input['ip'] ?? '';
        $cidr = (int) ($input['cidr'] ?? 0);
        
        try {
            $info = $this->calculateSubnet($ip, $cidr);
            return ToolResult::success($info);
        } catch (\\Exception $e) {
            return ToolResult::error($e->getMessage());
        }
    }
    
    private function calculateSubnet(string $ip, int $cidr): array
    {
        $network = long2ip(ip2long($ip) & (~0 << (32 - $cidr)));
        $broadcast = long2ip(ip2long($network) | (~0 << $cidr));
        $totalHosts = pow(2, 32 - $cidr) - 2;
        
        return [
            'network' => $network,
            'broadcast' => $broadcast,
            'total_hosts' => $totalHosts,
        ];
    }
}

// Usage
$calc = new IpCalculator();
$result = $calc->execute(['ip' => '192.168.1.0', 'cidr' => 24]);
print_r($result);
?>`,

	sql: `-- NetOps Solutions - Database Schema
-- Network tools configuration and history

CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id VARCHAR(50) NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools(tool_id)
);

-- Insert default tools
INSERT INTO tools (tool_id, name, category, description) VALUES
    ('ip-calculator', 'IP Calculator', 'network', 'Calculate subnets and IP ranges'),
    ('dns-lookup', 'DNS Lookup', 'network', 'Query DNS records over HTTPS'),
    ('password-generator', 'Password Generator', 'security', 'Generate secure passwords');

-- Query recent tool usage
SELECT 
    t.name,
    COUNT(h.id) as usage_count,
    AVG(h.execution_time_ms) as avg_time_ms
FROM tools t
LEFT JOIN tool_history h ON t.tool_id = h.tool_id
WHERE h.created_at > datetime('now', '-7 days')
GROUP BY t.id
ORDER BY usage_count DESC;`,

	bash: `#!/bin/bash
# NetOps Solutions - Network Diagnostic Script

set -euo pipefail

# Configuration
NETOPS_API="https://api.netops.local"
TIMEOUT=30

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# Check network connectivity
check_connectivity() {
    local host="\${1:-google.com}"
    
    if ping -c 1 -W \$TIMEOUT "\$host" > /dev/null 2>&1; then
        log_info "Host \$host is reachable"
        return 0
    else
        log_error "Host \$host is unreachable"
        return 1
    fi
}

# Get external IP
get_external_ip() {
    log_info "Fetching external IP..."
    curl -s --max-time \$TIMEOUT https://api.ipify.org
    echo
}

# Main execution
main() {
    log_info "Starting network diagnostics..."
    
    check_connectivity
    get_external_ip
    
    log_info "Diagnostics complete"
}

main "$@"`,

	xml: `<?xml version="1.0" encoding="UTF-8"?>
<netops-config xmlns="https://netops.local/schema/config"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xsi:schemaLocation="https://netops.local/schema/config config.xsd">
    
    <metadata>
        <version>0.10.0</version>
        <environment>production</environment>
        <last-updated>2024-01-15T10:30:00Z</last-updated>
    </metadata>
    
    <server>
        <host>0.0.0.0</host>
        <port>5770</port>
        <workers>4</workers>
        <ssl enabled="true">
            <cert-path>/etc/ssl/netops.crt</cert-path>
            <key-path>/etc/ssl/netops.key</key-path>
        </ssl>
    </server>
    
    <tools>
        <tool id="ip-calculator" enabled="true">
            <name>IP Calculator</name>
            <category>network</category>
            <route>/tools/ip</route>
        </tool>
        <tool id="dns-lookup" enabled="true">
            <name>DNS Lookup</name>
            <category>network</category>
            <route>/tools/dns</route>
        </tool>
    </tools>
    
    <logging>
        <level>info</level>
        <format>json</format>
        <output>stdout</output>
    </logging>
</netops-config>`,

	toml: `# NetOps Solutions Configuration
# Version 0.10.0

[metadata]
version = "0.10.0"
environment = "production"
last_updated = 2024-01-15

[server]
host = "0.0.0.0"
port = 5770
workers = 4

[server.ssl]
enabled = true
cert_path = "/etc/ssl/netops.crt"
key_path = "/etc/ssl/netops.key"

[[tools]]
id = "ip-calculator"
name = "IP Calculator"
category = "network"
enabled = true
route = "/tools/ip"

[[tools]]
id = "dns-lookup"
name = "DNS Lookup"
category = "network"
enabled = true
route = "/tools/dns"

[logging]
level = "info"
format = "json"
output = "stdout"`,

	rust: `// NetOps Solutions - IP Calculator Module

use std::net::{IpAddr, Ipv4Addr};
use std::str::FromStr;

/// Subnet information structure
#[derive(Debug, Clone)]
pub struct SubnetInfo {
    pub network: String,
    pub broadcast: String,
    pub first_host: String,
    pub last_host: String,
    pub total_hosts: u32,
}

/// Calculate subnet information from IP and CIDR
pub fn calculate_subnet(ip: &str, cidr: u8) -> Result<SubnetInfo, String> {
    let addr: Ipv4Addr = Ipv4Addr::from_str(ip)
        .map_err(|e| format!("Invalid IP address: {}", e))?;
    
    if cidr > 32 {
        return Err("CIDR must be between 0 and 32".to_string());
    }
    
    let addr_u32 = u32::from(addr);
    let mask = if cidr == 0 { 0 } else { (!0u32) << (32 - cidr) };
    
    let network = addr_u32 & mask;
    let broadcast = network | !mask;
    
    let first_host = if cidr < 31 { network + 1 } else { network };
    let last_host = if cidr < 31 { broadcast - 1 } else { broadcast };
    let total_hosts = if cidr >= 31 { 0 } else { (1u32 << (32 - cidr)) - 2 };
    
    Ok(SubnetInfo {
        network: Ipv4Addr::from(network).to_string(),
        broadcast: Ipv4Addr::from(broadcast).to_string(),
        first_host: Ipv4Addr::from(first_host).to_string(),
        last_host: Ipv4Addr::from(last_host).to_string(),
        total_hosts,
    })
}

fn main() {
    match calculate_subnet("192.168.1.0", 24) {
        Ok(info) => println!("{:#?}", info),
        Err(e) => eprintln!("Error: {}", e),
    }
}`,

	go: `// NetOps Solutions - IP Calculator Package

package main

import (
	"fmt"
	"net"
	"strconv"
)

// SubnetInfo contains calculated subnet information
type SubnetInfo struct {
	Network    string
	Broadcast  string
	FirstHost  string
	LastHost   string
	TotalHosts uint32
}

// CalculateSubnet calculates subnet information from IP and CIDR
func CalculateSubnet(ipStr string, cidr int) (*SubnetInfo, error) {
	_, ipNet, err := net.ParseCIDR(fmt.Sprintf("%s/%d", ipStr, cidr))
	if err != nil {
		return nil, fmt.Errorf("invalid CIDR notation: %w", err)
	}

	network := ipNet.IP
	mask := ipNet.Mask

	// Calculate broadcast
	broadcast := make(net.IP, len(network))
	for i := 0; i < len(network); i++ {
		broadcast[i] = network[i] | ^mask[i]
	}

	// Calculate first and last host
	firstHost := make(net.IP, len(network))
	lastHost := make(net.IP, len(network))
	copy(firstHost, network)
	copy(lastHost, broadcast)

	if cidr < 31 {
		firstHost[len(firstHost)-1]++
		lastHost[len(lastHost)-1]--
	}

	// Calculate total hosts
	var totalHosts uint32
	if cidr >= 31 {
		totalHosts = 0
	} else {
		totalHosts = (1 << (32 - cidr)) - 2
	}

	return &SubnetInfo{
		Network:    network.String(),
		Broadcast:  broadcast.String(),
		FirstHost:  firstHost.String(),
		LastHost:   lastHost.String(),
		TotalHosts: totalHosts,
	}, nil
}

func main() {
	info, err := CalculateSubnet("192.168.1.0", 24)
	if err != nil {
		fmt.Printf("Error: %v\\n", err)
		return
	}
	fmt.Printf("Network: %s\\n", info.Network)
	fmt.Printf("Total Hosts: %d\\n", info.TotalHosts)
}`,

	cpp: `// NetOps Solutions - IP Calculator
#include <iostream>
#include <string>
#include <bitset>
#include <sstream>
#include <iomanip>

struct SubnetInfo {
    std::string network;
    std::string broadcast;
    std::string firstHost;
    std::string lastHost;
    unsigned int totalHosts;
};

class IpCalculator {
public:
    SubnetInfo calculateSubnet(const std::string& ip, int cidr) {
        unsigned int ipAddr = parseIp(ip);
        unsigned int mask = cidr > 0 ? (~0 << (32 - cidr)) : 0;
        
        unsigned int network = ipAddr & mask;
        unsigned int broadcast = network | ~mask;
        
        SubnetInfo info;
        info.network = formatIp(network);
        info.broadcast = formatIp(broadcast);
        
        if (cidr < 31) {
            info.firstHost = formatIp(network + 1);
            info.lastHost = formatIp(broadcast - 1);
            info.totalHosts = (1 << (32 - cidr)) - 2;
        } else {
            info.firstHost = info.network;
            info.lastHost = info.broadcast;
            info.totalHosts = 0;
        }
        
        return info;
    }

private:
    unsigned int parseIp(const std::string& ip) {
        unsigned int a, b, c, d;
        char dot;
        std::istringstream iss(ip);
        iss >> a >> dot >> b >> dot >> c >> dot >> d;
        return (a << 24) | (b << 16) | (c << 8) | d;
    }
    
    std::string formatIp(unsigned int addr) {
        std::ostringstream oss;
        oss << ((addr >> 24) & 0xFF) << "."
            << ((addr >> 16) & 0xFF) << "."
            << ((addr >> 8) & 0xFF) << "."
            << (addr & 0xFF);
        return oss.str();
    }
};

int main() {
    IpCalculator calc;
    auto info = calc.calculateSubnet("192.168.1.0", 24);
    
    std::cout << "Network: " << info.network << std::endl;
    std::cout << "Broadcast: " << info.broadcast << std::endl;
    std::cout << "Total Hosts: " << info.totalHosts << std::endl;
    
    return 0;
}`,

	ruby: `#!/usr/bin/env ruby
# NetOps Solutions - IP Calculator

require 'ipaddr'

# Subnet information container
class SubnetInfo
  attr_reader :network, :broadcast, :first_host, :last_host, :total_hosts

  def initialize(network, broadcast, first_host, last_host, total_hosts)
    @network = network
    @broadcast = broadcast
    @first_host = first_host
    @last_host = last_host
    @total_hosts = total_hosts
  end

  def to_s
    <<~INFO
      Network: #{@network}
      Broadcast: #{@broadcast}
      First Host: #{@first_host}
      Last Host: #{@last_host}
      Total Hosts: #{@total_hosts}
    INFO
  end
end

# IP Calculator module
module IpCalculator
  def self.calculate_subnet(ip, cidr)
    network = IPAddr.new("#{ip}/#{cidr}")
    
    SubnetInfo.new(
      network.to_s,
      network.broadcast.to_s,
      cidr >= 31 ? network.to_s : (network.to_i + 1).to_s,
      cidr >= 31 ? network.broadcast.to_s : (network.broadcast.to_i - 1).to_s,
      cidr >= 31 ? 0 : (2**(32 - cidr) - 2)
    )
  end
end

# Main execution
if __FILE__ == $PROGRAM_NAME
  info = IpCalculator.calculate_subnet('192.168.1.0', 24)
  puts info
end`,
};
