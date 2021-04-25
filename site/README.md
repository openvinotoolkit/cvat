## Basic manual for website editing

### Edit or add documentation pages

To edit and/or add documentation, you need to have a [GitHub](https://github.com/login) account.
To change documentation files or add a documentation page,
simply click `Edit this page` on the page you would like to edit.
If you need to add a child page, click `Create child page`.

If you need to edit the text that has the markup [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet),
 click on the `Fork this reposytory` button.

Read how to edit files for githab ([GitHub docs](https://docs.github.com/en/github/managing-files-in-a-repository/editing-files-in-another-users-repository)).

Please note that files have a markup for correct display on the site: the title, the title of the link,
 the weight (affects the order of files display on the sidebar) and description (optional):

    ---
    title: "Title"
    linkTitle: "Link Title"
    weight: 1
    description: >
        Description
    ---

### Start site localy

To start the site locally, you need a recent [extended version hugo](https://github.com/gohugoio/hugo/releases) (recommend version 0.75.0 or later).
Open the most recent release and scroll down until you find a list of Extended versions. [Read more](https://gohugo.io/getting-started/installing/#quick-install)

Add a path to "hugo" in the "Path" environment variable.

Clone a repository branch containing the site. For example, using a git command:

    git clone --branch <branchname> <remote-repo-url>

If you want to build and/or serve your site locally, you also need to get local copies of the theme’s own submodules:

    git submodule update --init --recursive

To build and preview your site locally, use:

    cd <your local directory>/cvat/site/
    hugo server

By default, your site will be available at http://localhost:1313/

Instead of a "hugo server" command, you can use the "hugo" command that generates the site into a "public" folder.

To build or update your site’s CSS resources you will need [PostCSS](https://postcss.org/) to create final assets.
To install it you must have a recent version of [NodeJS](https://nodejs.org/en/) installed on your machine, so you can use npm, the Node package manager.
By default npm installs tools under the directory where you run [npm install](https://docs.npmjs.com/cli/v6/commands/npm-install#description):

    cd <your local directory>/cvat/site/
    npm install -g postcss-cli
    npm install autoprefixer
    npm audit fix

To make the site work correctly, you need to change `config.toml` to:

    base_URL:<your local directory>/public/

Then you can build a website in the "public" folder:

    cd <your local directory>/cvat/site/
    hugo

[Read more](https://www.docsy.dev/docs/getting-started/)
