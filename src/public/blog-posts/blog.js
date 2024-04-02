// Define function to fetch data from the provided URL
async function fetchBlogLinks() {
    try {
        const response = await fetch('https://austinlhoward.com/blogLinks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching blog links:', error);
        return [];
    }
}

// Define function to create sorted and grouped list of blog posts
async function createBlogPostList() {
    const blogLinks = await fetchBlogLinks();

    // Group blog posts by year
    const groupedByYear = blogLinks.reduce((acc, post) => {
        const year = post.year;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(post);
        return acc;
    }, {});

    // Sort years in descending order
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(b) - parseInt(a));


    // Create HTML elements for blog posts
    const blogList = document.getElementById('blog');
    blogList.innerHTML = '';

    sortedYears.forEach(year => {
        const spacer = document.createElement('div');
        spacer.className = 'spacer';
        blogList.appendChild(spacer);

        const column = document.createElement('div');
        column.className = 'fullYear';
        blogList.appendChild(column);

        const leftColumn = document.createElement('div');
        leftColumn.className = 'left-column';
        column.appendChild(leftColumn);

        const yearHeader = document.createElement('h3');
        yearHeader.textContent = year;
        leftColumn.appendChild(yearHeader);

        const rightColumn = document.createElement('div');
        rightColumn.className = 'right-column';
        column.appendChild(rightColumn);

        groupedByYear[year].sort((a, b) => {
            // Split dates into month and day components
            const [monthA, dayA] = a.restOfDate.split('/');
            const [monthB, dayB] = b.restOfDate.split('/');
            // Compare months first, then days
            if (parseInt(monthA) !== parseInt(monthB)) {
                return parseInt(monthB) - parseInt(monthA);
            } else {
                return parseInt(dayB) - parseInt(dayA);
            }
        }).forEach(post => {
            const postWrapper = document.createElement('div');
            postWrapper.className = 'post';
            const postTitle = document.createElement('h2');
            const postLink = document.createElement('a');
            postLink.href = post.link;
            postTitle.textContent = post.title;
            postLink.appendChild(postTitle);

            const postDate = document.createElement('p');
            postDate.textContent = post.restOfDate;

            rightColumn.appendChild(postWrapper);
            postWrapper.appendChild(postLink);
            postWrapper.appendChild(postDate);
        });
    });

    const contentElement = document.querySelector('.content');
    contentElement.appendChild(blogList);
}

// Call the function to create the blog post list
createBlogPostList();