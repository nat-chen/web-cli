export const InquirerConfig = {
  folderExist: [
    {
      type: "list",
      name: "recover",
      message: "Folder exists, choose below option",
      choices: [
        { name: "Create an new folders", value: "newFolder" },
        { name: "Cover", value: "cover" },
        { name: "Exit", value: "exit" },
      ],
    },
  ],
  rename: [
    {
      name: "inputNewName",
      type: "input",
      message: "Please input an new project name",
    },
  ],
};

export const RepoPath = "github:xxx";
