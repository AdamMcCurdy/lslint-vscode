# lslinter-vscode

A simple [Visual Studio Code](https://code.visualstudio.com/) extension to lint LSL scripts with `lslint`

## TODO
1. Will move linter release into package for easy install.
2. Make linter work on type instead of save only. 
3. Make #2 an option
4. Make the highlighted text the actual problem, not what follows problem.

## Requirements
1. Clone the linter `git clone https://github.com/Makopo/lslint.git`
2. Install it in your system path
3. Ensure that `lslint` is installed in your path, by opening up powershell or cmd or terminal and typing `lslint`;
4. Run [`Install Extension`](https://code.visualstudio.com/docs/editor/extension-gallery#_install-an-extension) command from [Command Palette](https://code.visualstudio.com/Docs/editor/codebasics#_command-palette).
5. Search and choose `lslint`.
6. Change icon

## Options
`"lslint.enable"` - enable LSL linter

`"lslint.warnOnSave"` - show warning message if there is an error when saving a file

Default options are:
```json
{
    "lsllinter.enable": true,
    "lsllinter.warnOnSave": false,
}        
```

**Enjoy!**