
const path = require('path')
const fs = require('fs');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')
const ConfigHelper = require("./ConfigHelper.js");
const { on } = require('events');
const {
    createJoinFunction,
    createJoinImplementation,
    asGenerator,
    defaultJoinGenerator,
   } = require('resolve-url-loader');

let configFunctions = new ConfigHelper();

let componentsObject = fs.readdirSync(configFunctions.pagesFolder).reduce((acc, fileName) => configFunctions.findPages(acc, fileName, configFunctions.pagesFolder), {"html":[],"chunks":[]});
let entries = componentsObject["chunks"].reduce((acc, path) =>configFunctions.findJsAndCssEntries(acc, path), {});


   
   // order source-map sampling location by your preferred precedence (matches defaultJoinGenerator)
   const vendoAssetsPathsGenerator = asGenerator(
    (item, ...rest) => {
        const defaultTuples = [...defaultJoinGenerator(item, ...rest)];
        let folder = defaultTuples[0][0];
       
        folder = folder.replace(/\\/g,"/");
        if(folder.indexOf('node_modules') != -1){
            defaultTuples[0][1] = path.join(folder.split('node_modules/')[1] , defaultTuples[0][1])
        }
       
        return defaultTuples;
    }
      
   );
   
   const myJoinFn = createJoinFunction(
     'myJoinFn',
     createJoinImplementation(vendoAssetsPathsGenerator),
   );

var twigConfig = {
    
    entry:  Object.assign({}, entries,{
       // "assets/store": "/src/assets/store/store.js"
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
                test: /\.(png|jpe?g|gif|jp2|webp|avif|svg|eot|woff|ttf)$/,
                loader: 'file-loader',
                type: "javascript/auto",
                options: {
                    name: "[name].[ext]",
                    outputPath: (url, resourcePath, context) => {
                        resourcePath = resourcePath.replace(/\\/g,"/");
                     
                        if(resourcePath.indexOf('node_modules') != -1)
                        {
                            return path.join('assets','vendor',resourcePath.split('node_modules/')[1]).replace(/\\/g,"/");
                        }
                        else {
                            return resourcePath.split('src/')[1].replace(/\\/g,"/")
                        }
                        
                    },
                    publicPath: (url, resourcePath, context) => {
                        resourcePath = resourcePath.replace(/\\/g,"/");
                        if(resourcePath.indexOf('node_modules') != -1)
                        {
                            return resourcePath.split('node_modules/')[1].replace(/\\/g,"/");
                        }
                        else {
                            return "/" + resourcePath.split('src/')[1].replace(/\\/g,"/")
                        }
                    },
                },
               
             
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    hotReload: false // disables Hot Reload
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                  // Creates `style` nodes from JS strings
                  //'style-loader',
                  MiniCssExtractPlugin.loader,
                  // Translates CSS into CommonJS
                  {
                    loader: 'css-loader',
                    options: {    
                        // url:false,
                        sourceMap: true,
                        esModule: false,
                        importLoaders: 2,
                    }
                  },
                 
                  {
                    loader: 'postcss-loader',
                    // options: { sourceMap: true}
                  },
                  {
                    loader: "sass-loader",
                    options: { 
                        sourceMap: true
                    } 
                  }
                  // Compiles Sass to CSS
                 
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
        new VueLoaderPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            'window.jQuery': "jquery",
            Vue: 'vue',
            'window.Vue' : 'vue',
            // store: "store"
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
            vue: 'vue/dist/vue.esm-browser.prod.js',
            // store: '/src/assets/store/store.js'  
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
					test: /node_modules|vendor/,
					chunks: "initial",
					name: "assets/vendor",
					priority: 10,
					enforce: true
				}
			}
		}
	},
    // cache: {
    //     type: 'filesystem',
    //   },
};

if(process.env.BUILD_MODE == "html") {
    var htmlConfig = Object.assign({}, twigConfig,{
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
        htmlConfig.resolve.alias.vue = 'vue/dist/vue.esm-browser.js';
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
    twigConfig.plugins.push(
        {
            apply: (compiler) => {
              compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                try{
                    let footerPath = path.join(__dirname,"bitrix","footer.twig");
                    var footerContent = fs.readFileSync(footerPath, { encoding: "utf-8" });
                    footerContent = footerContent.replace( new RegExp("<head>(.*?)<\/head>","gm"),"$1");
                    fs.writeFileSync(footerPath,footerContent)
                }
                catch {

                }
                
              });
            }
          }
    );
    module.exports = [twigConfig]
}