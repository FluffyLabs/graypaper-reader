import shell from "shelljs";

// Throw an error if any command fails
shell.config.fatal = true;

// Creating the public directory if it doesn't exist
shell.mkdir("-p", "public");

// Copying files from graypaper-archive/dist to public
shell.cp("-r", "graypaper-archive/dist/*", "public");
