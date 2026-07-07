import { Box, Button, Heading, Select, Text, VStack, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import AdUnit from '../../components/ads/AdUnit';

const AdTest = () => {
	const toast = useToast();
	const [scriptLoaded, setScriptLoaded] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [adMethod, setAdMethod] = useState("iframe"); // Default to iframe method
	const [isAdIframe, setIsAdIframe] = useState(true);

	useEffect(() => {
		//console.log('AdTest page mounted');
		//console.log(`Using ad method: ${adMethod}`);
    
		// Clean up any lingering AdSense elements
		document.querySelectorAll('.adsbygoogle-manual').forEach(el => {
			if (!el.getAttribute('data-ad-status')) {
				//console.log('Cleaning up lingering AdSense element');
				el.parentNode.removeChild(el);
			}
		});

		// Check if AdSense script is loaded
		const adsenseLoaded = !!window.adsbygoogle || 
													!!document.querySelector('script[src*="adsbygoogle.js"]');
		setScriptLoaded(adsenseLoaded);
    
		// Log AdSense state
		//console.log('AdSense object:', window.adsbygoogle);
		//console.log('Initialized slots:', window.adInitialized || {});
    
		return () => {
			//console.log('AdTest page unmounted');
		};
	}, [adMethod, refreshKey]);

	// Handler for the Reset button
	const handleResetAds = () => {
		// Reset ad initialization tracking
		window.adInitialized = {};
		window.adsAttempted = 0;
    
		// Force component to re-render with new keys
		setRefreshKey(prev => prev + 1);
    
		// Clean up any existing ad elements
		document.querySelectorAll('.adsbygoogle').forEach(el => {
			if (el.parentNode && el !== document.querySelector('.adsbygoogle-manual')) {
				el.parentNode.removeChild(el);
			}
		});
    
		toast({
			title: 'Ad state reset',
			description: 'Attempting to reinitialize ads',
			status: 'info',
			duration: 3000,
			isClosable: true,
		});
	};
  
	// Toggle between different ad rendering methods
	const handleMethodChange = (e) => {
		const newMethod = e.target.value;
		setAdMethod(newMethod);
		setIsAdIframe(newMethod === "iframe");
    
		// Reset when method changes
		handleResetAds();
    
		toast({
			title: `Switched to ${newMethod} method`,
			status: 'info',
			duration: 2000,
			isClosable: true,
		});
	};

	// Direct DOM approach for AdSense
	useEffect(() => {
		if (adMethod !== "direct") return;
    
		// Only run this code for the direct method
		const container = document.getElementById('manual-ad-container');
		if (!container) return;
    
		// Clean up previous ads
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
    
		// Create the AdSense element
		const adElement = document.createElement('ins');
		adElement.className = 'adsbygoogle adsbygoogle-manual';
		adElement.style.display = 'block';
		adElement.style.width = '100%';
		adElement.style.height = '250px';
		adElement.dataset.adClient = 'ca-pub-7733001105026476';
		adElement.dataset.adSlot = '5056340385';
		adElement.dataset.adFormat = 'auto';
		adElement.dataset.fullWidthResponsive = 'true';
		adElement.dataset.adtest = 'on';
    
		// Append to the container
		container.appendChild(adElement);
    
		// Push to AdSense after a delay
		setTimeout(() => {
			try {
				//console.log('Pushing ad via direct DOM method');
				(window.adsbygoogle = window.adsbygoogle || []).push({});
			} catch (error) {
				console.error('Error pushing ad via direct method:', error);
			}
		}, 100);
    
		return () => {
			// Clean up if component unmounts
			if (container && container.querySelector('.adsbygoogle-manual')) {
				container.removeChild(container.querySelector('.adsbygoogle-manual'));
			}
		};
	}, [adMethod, refreshKey]);

	return (
		<PageTemplate>
			<VStack spacing={8} align="stretch" width="100%">
				<Heading as="h1" size="xl">AdSense Test Page</Heading>
        
				<Text>This is a minimal test page for AdSense ads. Script loaded: {scriptLoaded ? 'Yes' : 'No'}</Text>
        
				<Box textAlign="center" mb={4}>
					<Select 
						mb={4} 
						value={adMethod} 
						onChange={handleMethodChange} 
						maxWidth="300px" 
						mx="auto"
					>
						<option value="iframe">Method 1: Iframe Isolation</option>
						<option value="standard">Method 2: Standard Component</option>
						<option value="direct">Method 3: Direct DOM Manipulation</option>
					</Select>
          
					<Button 
						colorScheme="green" 
						onClick={handleResetAds}
						size="sm"
					>
						Reset Ad State
					</Button>
				</Box>
        
				<Box 
					key={`ad-container-${refreshKey}`}
					width="100%" 
					maxWidth="728px" 
					mx="auto" 
					border="1px dashed gray" 
					p={2}
					mb={4}
				>
					<Text mb={2} fontSize="sm" color="gray.500">
						Ad Method: {adMethod === "iframe" ? "Iframe Isolation" : 
											adMethod === "standard" ? "Standard Component" : "Direct DOM"}
					</Text>
          
					{isAdIframe ? (
						/* Iframe method - uses our custom AdUnit component */
						<AdUnit 
							key={`ad-unit-${refreshKey}`}
							slotId="5056340385" 
							format="auto"
							style={{ 
								minHeight: '250px'
							}}
						/>
					) : adMethod === "standard" ? (
						/* Standard React component method */
						<Box
							key={`standard-ad-${refreshKey}`}
							className="adsbygoogle"
							data-ad-client="ca-pub-7733001105026476"
							data-ad-slot="5056340385"
							data-ad-format="auto"
							data-full-width-responsive="true"
							data-adtest="on"
							style={{
								display: 'block',
								minHeight: '250px'
							}}
							dangerouslySetInnerHTML={{
								__html: `<script>
									setTimeout(() => {
										try {
											console.log('Pushing standard component ad');
											(window.adsbygoogle = window.adsbygoogle || []).push({});
										} catch(e) {
											console.error('Error pushing standard ad:', e);
										}
									}, 100);
								</script>`
							}}
						/>
					) : (
						/* Direct DOM manipulation method */
						<Box
							id="manual-ad-container"
							key={`manual-ad-${refreshKey}`}
							minHeight="250px"
							width="100%"
						/>
					)}
				</Box>
        
				<Box p={4}>
					<Link to="/">
						<Button colorScheme="blue">Back to Home</Button>
					</Link>
				</Box>
			</VStack>
		</PageTemplate>
	);
};

export default AdTest;
