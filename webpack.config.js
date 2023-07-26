// webpack.config.js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack')

let globalFolder = "src";
let pagesFolder = path.join(globalFolder,'pages');

let findExtensions = function(filePath) {
    let result = [];

    const fileText = fs.readFileSync(filePath, { encoding: "utf-8" })
    const extendsExpr = new RegExp("extends.*\"(.*?)\"","gm");
    var matches = extendsExpr.exec(fileText);
    if(matches != null) {
        result.push(matches[1]); // abc
    }
    
    return result;
}

let findIncludes = function(filePath) {
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
let reduceTemplates = function(templates,parentPath) {
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
       
        let relativeFiles = findExtensionsAndIncludes(path.join(parentDir,extensionName));
        arPath["chunks"] = arPath["chunks"].concat(relativeFiles["chunks"]);
        arPath["files"] = arPath["files"].concat(relativeFiles["files"]);
        
        return arPath;

    }, {"chunks":[],"files":[]});
}

let findExtensionsAndIncludes = function(filePath) { 

    let extensions = findExtensions(filePath);
    let extensionsInfo = reduceTemplates(extensions,filePath);

    let includes = findIncludes(filePath);
    let includesInfo = reduceTemplates(includes,filePath);
    
    let templateInfo = extensionsInfo;
    templateInfo["chunks"] = templateInfo["chunks"].concat(includesInfo["chunks"]).filter(onlyUnique)
    templateInfo["files"] = templateInfo["files"].concat(includesInfo["files"]).filter(onlyUnique)
    
    return templateInfo;
    
}
function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

let findPages = function(acc, fileName, sourcePath) {
    
    let filePath = path.join(sourcePath,fileName)
    
    let result = findExtensionsAndIncludes(filePath);
    result["chunks"] = ["assets/js","assets/css"].concat(result["chunks"])
    let chunks = result["chunks"]

    filename = filePath.replace(globalFolder,'');
    if(process.env.BUILD_MODE == "html")
    {
        filename = filename.replace('.twig','.html').replace("\\pages","")
    }
    
    acc["html"].push(
        new HtmlWebpackPlugin({
            template: filePath,
            filename: filename,
            inject: "body",
            minify: false,
            chunks: result["chunks"]
        })
    )
   

    if(process.env.BUILD_MODE != "html")
    {
        result["files"].forEach(function(el, ind) {
            acc["html"].push(
                new HtmlWebpackPlugin({
                    template: path.join(globalFolder,el),
                    filename: el,
                    inject: false,
                    minify: false,
                    chunks: []
                })
            )
        });
    }
    
    acc["chunks"] = acc["chunks"].concat(result["chunks"]).filter(onlyUnique);
    return acc;
};

let componentsObject = fs.readdirSync(pagesFolder).reduce((acc, fileName) => findPages(acc, fileName, pagesFolder), {"html":[],"chunks":[]});

let findJsAndCssEntries = function(acc,nowPath) {
   
    let chunkPath = path.join(globalFolder,nowPath);
    if(nowPath.indexOf(globalFolder) != -1)
    {
        chunkPath = nowPath;
    }
    if (fs.existsSync(chunkPath)) {
        let files = fs.readdirSync(chunkPath).reduce((acc,v) => {
            let itemExt = v.split('.').pop();
            if((itemExt == "js" || itemExt == "sass" || itemExt == "scss" || itemExt ==  "css" ||  itemExt == "less") && !fs.lstatSync(path.join(chunkPath,v)).isDirectory()) {
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

let entries = componentsObject["chunks"].reduce((acc, path) =>findJsAndCssEntries(acc, path), {});

var twigConfig = {
    
    //mode: 'development',
    entry:  Object.assign({}, entries,{
        
       //hot: 'webpack/hot/dev-server.js',
        //client: 'webpack-dev-server/client/index.js?hot=true&live-reload=true',
        // vendor: ['bootstrap','jquery'],
     }),
    output: {
        path: path.resolve(__dirname, './bitrix'),
        //filename: '[name].[contenthash].js',
        publicPath: '/',
        filename: (pathData) => {
            
            let name = pathData.chunk.name.split('/').pop()
            return name === 'main' ? '[name]/main.js' : '[name]/script.js';
        },
    },
    module:{
        rules: [
            {
                test: /\.(eot|woff2?|svg|ttf)([\?]?.*)$/,
                use: 'file-loader?name=/assets/fonts/[name].[ext]'
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                 
                  // Creates `style` nodes from JS strings
                  //'style-loader',
                  MiniCssExtractPlugin.loader,
                  // Translates CSS into CommonJS
                  "css-loader",
                  
                  // Compiles Sass to CSS
                  "sass-loader",
                ],
              },
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: 
                [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"]
                        }
                    }
                ]
            }
   
        ],
    },
    plugins: [
        ...componentsObject["html"],
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            'window.jQuery': "jquery",
            Vue: 'vue',
            'window.Vue' : 'vue'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/assets/images', to: "assets/images", noErrorOnMissing: true},
                { from: 'src/assets/fonts', to: "assets/fonts", noErrorOnMissing: true },
                { from: 'src/assets/static', to: "assets/static", noErrorOnMissing: true},
            ]
        })
        
    ],
    resolve: {
        alias: {
          vue: 'vue/dist/vue.esm-browser.prod.js'
        }
      },
    watchOptions: {
       
        ignored: /node_modules/,
    },
    optimization: {
        
		chunkIds: "named",
		splitChunks: {
			cacheGroups: {
				commons: {
					chunks: "initial",
					minChunks: 2,
					maxInitialRequests: 5, // The default limit is too small to showcase the effect
					minSize: 0 // This is example is too small to create commons chunks
				},
				vendor: {
					test: /node_modules/,
					chunks: "initial",
					name: "vendor",
					priority: 10,
					enforce: true
				}
			}
		}
	},
    cache: {
        type: 'filesystem',
      },
};

if(process.env.BUILD_MODE == "html") {
    var htmlConfig = Object.assign({}, twigConfig,{
       
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        devServer: {
            hot: false,
            liveReload: true,
            open:true,
         },
        output: {
            path: path.resolve(__dirname, './html'),
            //filename: '[name].[contenthash].js',
            publicPath: '/',
            filename: (pathData) => {
                let name = pathData.chunk.name.split('/').pop()
                return name === 'main' ? '[name]/main.[contenthash].js' : '[name]/script.[contenthash].js';
            },
        },
        
    });
    htmlConfig.module.rules.push({
        test: /\.twig$/,
        use: [
            'raw-loader',
            'twig-html-loader'
        ]
    })
    
    htmlConfig.plugins.push(
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name]/style.[contenthash].css",
            chunkFilename: "[id].css",
          }),
    )

    

    if(process.env.BUILD_SYSTEM == "files") {
        htmlConfig.output.publicPath = "./"
        htmlConfig.mode = 'production';
        htmlConfig.plugins.push(new FileManagerPlugin({
            events: {
                onStart: {
                  delete: ['html'], 
                },
            },
        }))
    }
    else {
        htmlConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
        htmlConfig.optimization.runtimeChunk = 'single';
        htmlConfig.stats = {warnings:false};
        htmlConfig.devtool = 'source-map';
        htmlConfig.mode = 'development';
    }
    module.exports = [htmlConfig]
}
else {
    twigConfig.plugins.push(new FileManagerPlugin({
        events: {
            onStart: {
               delete: ['bitrix'], 
            },
        },
    }))
    twigConfig.plugins.push(
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: (pathData) => {
                let name = pathData.chunk.name.split('/').pop()
                return name === 'main' ? '[name]/main.css' : '[name]/style.css';
            },
            chunkFilename: "[id].css",
          }),
    )
    module.exports = [twigConfig]
}