fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
        const clientIP = data.ip;
        // Fetch country information using iplocation.net API
        fetch(`https://api.iplocation.net/?ip=${clientIP}`)
            .then(response => response.json())
            .then(ipData => {
                const countryName = ipData.country_name;
                // Send the obtained IP address and country name to the server
                fetch('/', {
                    method: 'POST',
                    body: JSON.stringify({ ip: clientIP, country: countryName }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            })
            .catch(error => console.error('Error fetching IP data:', error));
    })
    .catch(error => console.error('Error fetching IP:', error));