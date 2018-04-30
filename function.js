var request = require("request");
var requestSync = require("sync-request");
var async = require("async");
var array = require("array");
var config = require("./config");
var cheerio = require("cheerio");
var traceRedirect = require("trace-redirect").default;

var functions = {
  authorize: function(req, res) {
    var header = config.consumerkey + ":" + config.consumersecret;
    var encheader = new Buffer(header).toString("base64");
    var finalheader = "Basic " + encheader;

    request.post(
      "https://api.twitter.com/oauth2/token",
      {
        form: { grant_type: "client_credentials" },
        headers: { Authorization: finalheader }
      },
      function(error, response, body) {
        if (error) console.log(error);
        else {
          config.bearertoken = JSON.parse(body).access_token;

          res.json({ success: true, data: config.bearertoken });
        }
      }
    );
  },
  search: function(req, res) {
    var searchquery = req.body.hashtag;
    var encsearchquery = encodeURIComponent(searchquery);

    var header = config.consumerkey + ":" + config.consumersecret;
    var encheader = new Buffer(header).toString("base64");
    var finalheader = "Basic " + encheader;

    request.post(
      "https://api.twitter.com/oauth2/token",
      {
        form: { grant_type: "client_credentials" },
        headers: { Authorization: finalheader }
      },
      function(error, response, body) {
        if (error) {
          console.log(error);
          res.json({
            version: "1.0.0",
            status: "error",
            code: 401,
            message: "Unauthorized",
            data: ""
          });
        } else {
          config.bearertoken = JSON.parse(body).access_token;
          // res.json({success: true, data:config.bearertoken});
          var bearerheader = "Bearer " + config.bearertoken;

          request.get(
            "https://api.twitter.com/1.1/search/tweets.json?q=" +
              encsearchquery +
              "&result_type=recent",
            { headers: { Authorization: bearerheader } },
            function(error, body, response) {
              if (error) {
                console.log(error);
                res.json({
                  version: "1.0.0",
                  status: "error",
                  code: 400,
                  message: "Bad Request",
                  data: ""
                });
              } else {
                resData = array();

                var data = JSON.parse(body.body);
                var tweets = data.statuses;
                var responseData = [];
                async.eachSeries(
                  tweets,
                  function(tweet, callback1) {
                    if (tweet.entities.urls.length > 0) {
                      var urls = tweet.entities.urls;
                      async.eachSeries(
                        urls,
                        function(url, callback2) {
                          var extendedUrl = url.expanded_url;
                          var result = functions.processUrl(extendedUrl);
                          if (result.host != "twitter.com") {
                            traceRedirect(extendedUrl).then(function(
                              cleanedURL
                            ) {
                              var siteUrl = cleanedURL
                                .replace(/utm_[^&]+&?/g, "")
                                .replace(/&$/, "")
                                .replace(/^\?$/, "");
                              request(siteUrl, function(error, response, html) {
                                if (!error && response.statusCode === 200) {
                                  const $ = cheerio.load(html);
                                  const parsedResults = [];
                                  let ogDescription = "";
                                  let ogImage = "";
                                  let ogUrl = "";
                                  let ogType = "";
                                  let ogTitle = "";
                                  let ogLocale = "";
                                  let ogSiteName = "";
                                  let description = "";
                                  let keywords = "";
                                  let author = "";
                                  let viewport = "";
                                  const metadata = {};
                                  $("meta").each(function(i, element) {
                                    if (
                                      element.attribs.property ===
                                        "og:description" &&
                                      ogDescription === ""
                                    ) {
                                      ogDescription = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property === "og:image" &&
                                      ogImage === ""
                                    ) {
                                      ogImage = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property === "og:url" &&
                                      ogUrl === ""
                                    ) {
                                      ogUrl = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property === "og:type" &&
                                      ogType === ""
                                    ) {
                                      ogType = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property === "og:title" &&
                                      ogTitle === ""
                                    ) {
                                      ogTitle = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property ===
                                        "og:locale" &&
                                      ogLocale === ""
                                    ) {
                                      ogLocale = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.property ===
                                        "og:site_name" &&
                                      ogSiteName === ""
                                    ) {
                                      ogSiteName = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.name === "Description" &&
                                      description === ""
                                    ) {
                                      description = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.name === "Keywords" &&
                                      keywords === ""
                                    ) {
                                      keywords = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.name === "author" &&
                                      author === ""
                                    ) {
                                      author = element.attribs.content;
                                    }
                                    if (
                                      element.attribs.name === "viewport" &&
                                      viewport === ""
                                    ) {
                                      viewport = element.attribs.content;
                                    }
                                  });
                                  const title = $("title").text();
                                  if (ogDescription !== "") {
                                    metadata["og:description"] = ogDescription;
                                  }
                                  if (ogImage !== "") {
                                    metadata["og:image"] = ogImage;
                                  }
                                  if (ogUrl !== "") {
                                    metadata["og:url"] = ogUrl;
                                  }
                                  if (ogType !== "") {
                                    metadata["og:type"] = ogType;
                                  }
                                  if (ogTitle !== "") {
                                    metadata["og:title"] = ogTitle;
                                  }
                                  if (ogLocale !== "") {
                                    metadata["og:locale"] = ogLocale;
                                  }
                                  if (ogSiteName !== "") {
                                    metadata["og:site_name"] = ogSiteName;
                                  }
                                  if (description !== "") {
                                    const descLabel = "description";
                                    metadata[descLabel] = description;
                                  }
                                  if (keywords !== "") {
                                    const keywordLabel = "keywords";
                                    metadata[keywordLabel] = keywords;
                                  }
                                  if (author !== "") {
                                    const authorLabel = "author";
                                    metadata[authorLabel] = author;
                                  }
                                  if (viewport !== "") {
                                    const viewportLabel = "viewport";
                                    metadata[viewportLabel] = viewport;
                                  }
                                  if (title !== "" && title !== undefined) {
                                    const titleLabel = "title";
                                    metadata[titleLabel] = title;
                                  }
                                  resData.push(metadata);
                                } else {
                                  //res.send("Invalid Url");
                                }
                                callback2();
                              });
                            });
                          } else {
                            callback2();
                          }
                        },
                        function(err, result) {
                          callback1();
                        }
                      );
                    } else {
                      callback1();
                    }
                  },
                  function(err, result) {
                    res.json({
                      version: "1.0.0",
                      status: "success",
                      code: 200,
                      message: "OK",
                      data: resData
                    });
                  }
                );
              }
            }
          );
        }
      }
    );
  },
  processUrl: function(reqUrl) {
    var url = require("url");
    var result = url.parse(reqUrl, true);
    return result;
  }
};
module.exports = functions;
