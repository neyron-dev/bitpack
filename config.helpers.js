// class ConfigHelper {

//     let globalFolder = "src";
//     let pagesFolder = path.join(globalFolder,'pages');
    
//     let findExtensions = function(filePath) {
//         let result = [];
    
//         const fileText = fs.readFileSync(filePath, { encoding: "utf-8" })
//         const extendsExpr = new RegExp("extends.*\"(.*?)\"","gm");
//         var matches = extendsExpr.exec(fileText);
//         if(matches != null) {
//             result.push(matches[1]); // abc
//         }
        
//         return result;
//     }
    
//     let findIncludes = function(filePath) {
//         let result = [];
    
//         const fileText = fs.readFileSync(filePath, { encoding: "utf-8" })
//         const extendsExpr = new RegExp("include.*\"(.*?)\"","gm");
    
//         var matches;
//         do {
//             matches = extendsExpr.exec(fileText);
//             if (matches) {
//                 result.push(matches[1]); // abc
//             }
//         } while (matches);
    
//         return result;
//     }
//     let reduceTemplates = function(templates,parentPath) {
//         return templates.reduce((arPath, extensionName) => { 
            
//             let parentDir = path.dirname(parentPath)
//             let extensionNameCleared = extensionName.replace('../',"").replace('./',"/")
         
//             let chunkName = path.dirname(extensionName);
//             arPath["chunks"].push(path.join(parentDir,chunkName).replace("src","").replace(/\\/g,"/"))
//             arPath["files"].push(path.join(parentDir,extensionName).replace("src","").replace(/\\/g,"/"))
           
//             let relativeFiles = findExtensionsAndIncludes(path.join(parentDir,extensionName));
//             arPath["chunks"] = arPath["chunks"].concat(relativeFiles["chunks"]);
//             arPath["files"] = arPath["files"].concat(relativeFiles["files"]);
            
//             return arPath;
    
//         }, {"chunks":[],"files":[]});
//     }
    
//     let findExtensionsAndIncludes = function(filePath) { 
    
//         let extensions = findExtensions(filePath);
//         let extensionsInfo = reduceTemplates(extensions,filePath);
    
//         let includes = findIncludes(filePath);
//         let includesInfo = reduceTemplates(includes,filePath);
        
//         let templateInfo = extensionsInfo;
//         templateInfo["chunks"] = templateInfo["chunks"].concat(includesInfo["chunks"]).filter(onlyUnique)
//         templateInfo["files"] = templateInfo["files"].concat(includesInfo["files"]).filter(onlyUnique)
        
//         return templateInfo;
        
//     }
//     function onlyUnique(value, index, array) {
//         return array.indexOf(value) === index;
//     }
    
//     let findPages = function(acc, fileName, sourcePath) {
        
//         let filePath = path.join(sourcePath,fileName)
        
//         let result = findExtensionsAndIncludes(filePath);
       
//         let chunks = result["chunks"]
    
//         filename = filePath.replace(globalFolder,'');
//         if(process.env.BUILD_MODE == "development")
//         {
//             filename = filename.replace('.twig','.html').replace("\\pages","")
//         }
        
//         acc["html"].push(
//             new HtmlWebpackPlugin({
//                 template: filePath,
//                 filename: filename,
//                 inject: "body",
//                 minify: false,
//                 chunks: result["chunks"]
//             })
//         )
       
    
//         if(process.env.BUILD_MODE != "development")
//         {
//             result["files"].forEach(function(el, ind) {
//                 acc["html"].push(
//                     new HtmlWebpackPlugin({
//                         template: path.join(globalFolder,el),
//                         filename: el,
//                         inject: false,
//                         minify: false,
//                         chunks: []
//                     })
//                 )
//             });
//         }
        
//         acc["chunks"] = acc["chunks"].concat(result["chunks"]);
//         return acc;
//     };
// }
