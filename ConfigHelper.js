const path = require('path')
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class ConfigHelper {
    constructor()
    {
        this.globalFolder = "src";
        this.pagesFolder = path.join(this.globalFolder,'pages');
        this.additionalChunks = ["vendor","assets/store","assets/js","assets/css"];
    }
   
    
    findExtensions = function(filePath) {
        let result = [];
    
        const fileText = fs.readFileSync(filePath, { encoding: "utf-8" })
        const extendsExpr = new RegExp("extends.*\"(.*?)\"","gm");
        var matches = extendsExpr.exec(fileText);
        if(matches != null) {
            result.push(matches[1]); // abc
        }
        
        return result;
    }
    
    findIncludes = function(filePath) {
        let result = [];
    
        const fileText = fs.readFileSync(filePath, { encoding: "utf-8" })
        const extendsExpr = new RegExp("include.*\"(.*?)\"","gm");
    
        var matches;
        do {
            matches = extendsExpr.exec(fileText);
            if (matches) {
                result.push(matches[1]); // abc
            }
        } while (matches);
    
        return result;
    }

    reduceTemplates = function(templates,parentPath) {
        let self = this;
        return templates.reduce((arPath, extensionName) => { 
            
            let parentDir = path.dirname(parentPath)
            let extensionNameCleared = extensionName.replace('../',"").replace('./',"/")
         
            let chunkName = path.dirname(extensionName);
            let chunkPath = path.join(parentDir,chunkName).replace("src/","").replace("src\\","").replace(/\\/g,"/")
            if(chunkPath != "src")
            {
                arPath["chunks"].push(chunkPath)
            }
           
            arPath["files"].push(path.join(parentDir,extensionName).replace("src","").replace(/\\/g,"/"))
           
            let relativeFiles = self.findExtensionsAndIncludes(path.join(parentDir,extensionName));
            arPath["chunks"] = arPath["chunks"].concat(relativeFiles["chunks"]);
            arPath["files"] = arPath["files"].concat(relativeFiles["files"]);
            
            return arPath;
    
        }, {"chunks":[],"files":[]});
    }
    
    findExtensionsAndIncludes = function(filePath) { 
        let self = this;
        let extensions = self.findExtensions(filePath);
        let extensionsInfo = self.reduceTemplates(extensions,filePath);
    
        let includes = self.findIncludes(filePath);
        let includesInfo = self.reduceTemplates(includes,filePath);
        
        let templateInfo = extensionsInfo;
        templateInfo["chunks"] = templateInfo["chunks"].concat(includesInfo["chunks"]).filter(self.onlyUnique)
        templateInfo["files"] = templateInfo["files"].concat(includesInfo["files"]).filter(self.onlyUnique)
        
        return templateInfo;
        
    }

    onlyUnique(value, index, array) {
        return array.indexOf(value) === index;
    }
    
    findPages = function(acc, fileName, sourcePath) {
        let self = this;
        let filePath = path.join(sourcePath,fileName)
        
        let result = self.findExtensionsAndIncludes(filePath);
        result["chunks"] = this.additionalChunks.concat(result["chunks"])
        
        let chunks = result["chunks"];

        let fileNameResult = filePath.replace(self.globalFolder,'');
        if(process.env.BUILD_MODE == "html")
        {
            fileNameResult = fileNameResult.replace('.twig','.html').replace("\\pages","")
        }
        else {
            chunks = self.additionalChunks;
        }
        
        acc["html"].push(
            new HtmlWebpackPlugin({
                template: filePath,
                filename: fileNameResult,
                inject: true,
                minify: false,
                chunks: chunks
            })
        )
       
    
        if(process.env.BUILD_MODE != "html")
        {
            result["files"].forEach(function(el, ind) {
                let subTemplateChunks = [];
                if(el.indexOf('footer.twig') != -1 )
                {
                    subTemplateChunks = self.additionalChunks;
                }
                
                acc["html"].push(
                    new HtmlWebpackPlugin({
                        template: path.join(self.globalFolder,el),
                        filename: el,
                        inject: true,
                        minify: false,
                        chunks: subTemplateChunks
                    })
                )
            });
        }
        
        acc["chunks"] = acc["chunks"].concat(result["chunks"]).filter(self.onlyUnique);
        return acc;
    };

    findJsAndCssEntries = function(acc,nowPath) {
        let self = this;
        let chunkPath = path.join(self.globalFolder,nowPath);
        if(nowPath.indexOf(self.globalFolder) != -1)
        {
            chunkPath = nowPath;
        }
        if (fs.existsSync(chunkPath)) {
            let files = fs.readdirSync(chunkPath).reduce((acc,v) => {
                let itemExt = v.split('.').pop();
                if((itemExt == "js" || itemExt == "sass" || itemExt == "scss" || itemExt ==  "css" ||  itemExt == "less" ) && !fs.lstatSync(path.join(chunkPath,v)).isDirectory()) {
                    acc.push("./" +path.join( chunkPath ,v ).replace(/\\/g,"/"))
                } 
                else if((itemExt == "js" || itemExt == "sass" || itemExt == "scss" || itemExt ==  "css" ||  itemExt == "less") && fs.lstatSync(path.join(chunkPath,v)).isDirectory()) {
                
                    let jsFolderFiles = fs.readdirSync(path.join(chunkPath,v)).filter((filePath) => {
                        let fileExt = filePath.split('.').pop();
                        return fileExt == "js" || fileExt == "sass" || fileExt == "scss" || fileExt ==  "css" ||  fileExt == "less";
                    });
                
                    jsFolderFiles.forEach(function(val, index) {
                        acc.push("./" +path.join(chunkPath ,  v ,val).replace(/\\/g,"/"))
                    });
                    
                }
                return acc;
            }, []);
            
            if(files.length > 0)
                acc[nowPath] = files
        }
        return acc;
    }
}

module.exports = ConfigHelper