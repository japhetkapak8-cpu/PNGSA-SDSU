import {
  createClient
} from "npm:@supabase/supabase-js@2";


/* =========================================================
   ENVIRONMENT
========================================================= */

const SUPABASE_URL =
  Deno.env.get(
    "SUPABASE_URL"
  )!;

const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY"
  )!;


const YOUTUBE_CLIENT_ID =
  Deno.env.get(
    "YOUTUBE_CLIENT_ID"
  );

const YOUTUBE_CLIENT_SECRET =
  Deno.env.get(
    "YOUTUBE_CLIENT_SECRET"
  );

const YOUTUBE_REFRESH_TOKEN =
  Deno.env.get(
    "YOUTUBE_REFRESH_TOKEN"
  );


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_BUCKET =
  "social-media-submissions";


/* =========================================================
   CORS

   Required because admin/social-media.html calls this
   Edge Function from the browser.
========================================================= */

const corsHeaders = {

  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",

};


/* =========================================================
   SUPABASE SERVICE CLIENT
========================================================= */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );


/* =========================================================
   EDGE FUNCTION
========================================================= */

Deno.serve(
  async req => {

    /*
     * Browser CORS preflight.
     *
     * This MUST happen before checking
     * for POST.
     */

    if (
      req.method ===
      "OPTIONS"
    ) {

      return new Response(
        "ok",
        {
          status: 200,
          headers:
            corsHeaders
        }
      );

    }


    /*
     * Only POST is supported.
     */

    if (
      req.method !==
      "POST"
    ) {

      return jsonResponse(
        {
          success: false,
          error:
            "Method not allowed."
        },
        405
      );

    }


    /*
     * Keep the queue ID outside the try block.
     *
     * This avoids trying to read req.json()
     * again inside catch.
     */

    let postId:
      string | null =
        null;


    try {

      /* =====================================================
         REQUEST BODY
      ====================================================== */

      let body:
        Record<string, unknown>;


      try {

        body =
          await req.json();

      }
      catch {

        return jsonResponse(
          {
            success: false,
            error:
              "Request body must contain valid JSON."
          },
          400
        );

      }


      postId =
        typeof body?.post_id ===
          "string"
          ? body.post_id.trim()
          : null;


      if (
        !postId
      ) {

        return jsonResponse(
          {
            success: false,
            error:
              "post_id is required."
          },
          400
        );

      }


      console.log(
        "social-publisher invoked:",
        {
          postId
        }
      );


      /* =====================================================
         GET QUEUED POST
      ====================================================== */

      const {
        data: post,
        error: postError
      } =
        await supabase
          .from(
            "social_media_posts"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            postId
          )
          .single();


      if (
        postError ||
        !post
      ) {

        throw new Error(
          postError?.message ||
          "Post queue record not found."
        );

      }


      console.log(
        "Queue row found:",
        {
          id:
            post.id,
          platform:
            post.platform,
          status:
            post.status
        }
      );


      /* =====================================================
         IDEMPOTENCY
      ====================================================== */

      if (
        post.status ===
        "published"
      ) {

        return jsonResponse(
          {
            success: true,
            message:
              "Post is already published.",
            post
          },
          200
        );

      }


      if (
        post.status !==
          "queued" &&
        post.status !==
          "failed"
      ) {

        return jsonResponse(
          {
            success: false,

            error:
              `Post status must be queued or failed. Current status: ${post.status}`
          },
          400
        );

      }


      /* =====================================================
         GET SUBMISSION
      ====================================================== */

      const {
        data:
          submission,
        error:
          submissionError
      } =
        await supabase
          .from(
            "social_media_submissions"
          )
          .select(
            "*"
          )
          .eq(
            "id",
            post.submission_id
          )
          .single();


      if (
        submissionError ||
        !submission
      ) {

        throw new Error(
          submissionError?.message ||
          "Submission not found."
        );

      }


      if (
        !submission.video_url
      ) {

        throw new Error(
          "Submission has no video."
        );

      }


      /* =====================================================
         MARK QUEUE ROW AS PUBLISHING
      ====================================================== */

      await updatePost(
        post.id,
        {
          status:
            "publishing",

          error_message:
            null
        }
      );


      await updateSubmissionStatus(
        submission.id
      );


      console.log(
        "Publishing started:",
        {
          postId:
            post.id,
          platform:
            post.platform
        }
      );


      /* =====================================================
         PLATFORM DISPATCH
      ====================================================== */

      let result:
        PublishingResult;


      switch (
        post.platform
      ) {

        case "youtube":

          result =
            await publishToYouTube(
              submission
            );

          break;


        case "facebook":

          throw new Error(
            "Facebook publishing is not configured yet."
          );


        case "instagram":

          throw new Error(
            "Instagram publishing is not configured yet."
          );


        case "tiktok":

          throw new Error(
            "TikTok publishing is not configured yet."
          );


        default:

          throw new Error(
            `Unsupported platform: ${post.platform}`
          );

      }


      /* =====================================================
         MARK PLATFORM POST AS PUBLISHED
      ====================================================== */

      const publishedAt =
        new Date()
          .toISOString();


      await updatePost(
        post.id,
        {

          status:
            "published",

          external_post_id:
            result.external_post_id,

          external_url:
            result.external_url,

          error_message:
            null,

          published_at:
            publishedAt

        }
      );


      /* =====================================================
         UPDATE SUBMISSION
      ====================================================== */

      await updateSubmissionStatus(
        submission.id
      );


      console.log(
        "Publishing successful:",
        {
          postId:
            post.id,
          platform:
            post.platform,
          externalId:
            result.external_post_id,
          externalUrl:
            result.external_url
        }
      );


      /* =====================================================
         SUCCESS RESPONSE
      ====================================================== */

      return jsonResponse(
        {

          success:
            true,

          platform:
            post.platform,

          external_post_id:
            result.external_post_id,

          external_url:
            result.external_url

        },
        200
      );

    }
    catch (
      error
    ) {

      const errorMessage =
        error instanceof Error
          ? error.message
          : String(
              error
            );


      console.error(
        "social-publisher error:",
        {
          postId,
          error:
            errorMessage
        }
      );


      /* =====================================================
         MARK QUEUE ROW FAILED
      ====================================================== */

      if (
        postId
      ) {

        try {

          /*
           * Get submission ID first so we can
           * update the overall submission status too.
           */

          const {
            data: failedPost
          } =
            await supabase
              .from(
                "social_media_posts"
              )
              .select(
                "id, submission_id"
              )
              .eq(
                "id",
                postId
              )
              .maybeSingle();


          await updatePost(
            postId,
            {

              status:
                "failed",

              error_message:
                errorMessage

            }
          );


          if (
            failedPost?.submission_id
          ) {

            await updateSubmissionStatus(
              failedPost.submission_id
            );

          }

        }
        catch (
          updateError
        ) {

          console.error(
            "Could not save failed queue status:",
            updateError
          );

        }

      }


      /* =====================================================
         ERROR RESPONSE
      ====================================================== */

      return jsonResponse(
        {

          success:
            false,

          error:
            errorMessage

        },
        500
      );

    }

  }
);


/* =========================================================
   TYPES
========================================================= */

type PublishingResult = {

  external_post_id:
    string;

  external_url:
    string;

};


/* =========================================================
   YOUTUBE
========================================================= */

async function publishToYouTube(
  submission: any
):
  Promise<PublishingResult> {

  /* =======================================================
     VERIFY SECRETS
  ======================================================== */

  if (
    !YOUTUBE_CLIENT_ID ||
    !YOUTUBE_CLIENT_SECRET ||
    !YOUTUBE_REFRESH_TOKEN
  ) {

    throw new Error(
      "YouTube OAuth secrets are not configured."
    );

  }


  console.log(
    "Refreshing YouTube OAuth access token..."
  );


  /* =======================================================
     GET ACCESS TOKEN
  ======================================================== */

  const accessToken =
    await getYouTubeAccessToken();


  console.log(
    "YouTube OAuth access token refreshed."
  );


  /* =======================================================
     DOWNLOAD VIDEO
  ======================================================== */

  console.log(
    "Downloading submission video..."
  );


  const videoBlob =
    await downloadSubmissionVideo(
      submission.video_url
    );


  console.log(
    "Video downloaded:",
    {
      size:
        videoBlob.size,
      type:
        videoBlob.type
    }
  );


  /* =======================================================
     TITLE
  ======================================================== */

  const title =
    String(
      submission.title ||
      "PNGSA Video"
    )
      .trim()
      .slice(
        0,
        100
      );


  /* =======================================================
     DESCRIPTION
  ======================================================== */

  const description =
    buildYouTubeDescription(
      submission
    );


  /* =======================================================
     METADATA
  ======================================================== */

  const metadata = {

    snippet: {

      title,

      description,

      categoryId:
        "22"

    },

    status: {

      /*
       * Keep private while testing.
       *
       * Change to "public" later if you want
       * successful uploads to appear publicly
       * on the PNGSA YouTube channel immediately.
       */

      privacyStatus:
        "private",

      selfDeclaredMadeForKids:
        false

    }

  };


  /* =======================================================
     MULTIPART BODY
  ======================================================== */

  const boundary =
    `pngsa-${crypto.randomUUID()}`;


  const metadataBlob =
    new Blob(
      [
        JSON.stringify(
          metadata
        )
      ],
      {
        type:
          "application/json; charset=UTF-8"
      }
    );


  const multipartBody =
    await buildMultipartRelatedBody(
      boundary,
      metadataBlob,
      videoBlob
    );


  /* =======================================================
     YOUTUBE UPLOAD
  ======================================================== */

  console.log(
    "Sending video to YouTube..."
  );


  const response =
    await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart",
      {

        method:
          "POST",

        headers: {

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            `multipart/related; boundary=${boundary}`

        },

        body:
          multipartBody

      }
    );


  let data:
    any;


  try {

    data =
      await response.json();

  }
  catch {

    data =
      null;

  }


  /* =======================================================
     YOUTUBE ERROR
  ======================================================== */

  if (
    !response.ok
  ) {

    console.error(
      "YouTube API error:",
      {
        status:
          response.status,
        statusText:
          response.statusText,
        response:
          data
      }
    );


    const googleMessage =
      data?.error?.message;


    const googleReason =
      data?.error?.errors?.[0]
        ?.reason;


    const message =
      [
        googleMessage,
        googleReason
          ? `Reason: ${googleReason}`
          : null,
        `HTTP ${response.status}`
      ]
        .filter(
          Boolean
        )
        .join(
          " | "
        );


    throw new Error(
      message ||
      "YouTube upload failed."
    );

  }


  /* =======================================================
     VERIFY VIDEO ID
  ======================================================== */

  const videoId =
    data?.id;


  if (
    !videoId
  ) {

    console.error(
      "YouTube response missing ID:",
      data
    );


    throw new Error(
      "YouTube accepted the request but did not return a video ID."
    );

  }


  console.log(
    "YouTube video created:",
    videoId
  );


  return {

    external_post_id:
      videoId,

    external_url:
      `https://www.youtube.com/watch?v=${videoId}`

  };

}


/* =========================================================
   YOUTUBE ACCESS TOKEN
========================================================= */

async function getYouTubeAccessToken() {

  const params =
    new URLSearchParams({

      client_id:
        YOUTUBE_CLIENT_ID!,

      client_secret:
        YOUTUBE_CLIENT_SECRET!,

      refresh_token:
        YOUTUBE_REFRESH_TOKEN!,

      grant_type:
        "refresh_token"

    });


  const response =
    await fetch(
      "https://oauth2.googleapis.com/token",
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/x-www-form-urlencoded"

        },

        body:
          params

      }
    );


  let data:
    any;


  try {

    data =
      await response.json();

  }
  catch {

    data =
      null;

  }


  if (
    !response.ok ||
    !data?.access_token
  ) {

    console.error(
      "Google token error:",
      {
        status:
          response.status,
        response:
          data
      }
    );


    throw new Error(
      data?.error_description ||
      data?.error ||
      `Could not refresh YouTube access token. HTTP ${response.status}`
    );

  }


  return String(
    data.access_token
  );

}


/* =========================================================
   DOWNLOAD PRIVATE VIDEO
========================================================= */

async function downloadSubmissionVideo(
  videoValue: string
) {

  /* =======================================================
     HTTP / LEGACY URL
  ======================================================== */

  if (
    isHttpUrl(
      videoValue
    )
  ) {

    const response =
      await fetch(
        videoValue
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `Could not download video from URL. HTTP ${response.status}`
      );

    }


    return await response.blob();

  }


  /* =======================================================
     PRIVATE SUPABASE STORAGE
  ======================================================== */

  const {
    data,
    error
  } =
    await supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .download(
        videoValue
      );


  if (
    error ||
    !data
  ) {

    console.error(
      "Storage download error:",
      {
        path:
          videoValue,
        error
      }
    );


    throw new Error(
      error?.message ||
      "Could not download private video."
    );

  }


  return data;

}


/* =========================================================
   YOUTUBE DESCRIPTION
========================================================= */

function buildYouTubeDescription(
  submission: any
) {

  const parts:
    string[] =
      [];


  if (
    submission.caption
  ) {

    parts.push(
      String(
        submission.caption
      )
    );

  }


  if (
    submission.hashtags
  ) {

    parts.push(
      String(
        submission.hashtags
      )
    );

  }


  return parts
    .join(
      "\n\n"
    )
    .slice(
      0,
      5000
    );

}


/* =========================================================
   BUILD MULTIPART YOUTUBE BODY
========================================================= */

async function buildMultipartRelatedBody(
  boundary: string,
  metadataBlob: Blob,
  videoBlob: Blob
) {

  const encoder =
    new TextEncoder();


  const metadataBytes =
    new Uint8Array(
      await metadataBlob
        .arrayBuffer()
    );


  const videoBytes =
    new Uint8Array(
      await videoBlob
        .arrayBuffer()
    );


  const start =
    encoder.encode(

      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n`

    );


  const middle =
    encoder.encode(

      `\r\n--${boundary}\r\n` +
      `Content-Type: ${videoBlob.type || "video/mp4"}\r\n\r\n`

    );


  const end =
    encoder.encode(
      `\r\n--${boundary}--\r\n`
    );


  const totalLength =
    start.length +
    metadataBytes.length +
    middle.length +
    videoBytes.length +
    end.length;


  const combined =
    new Uint8Array(
      totalLength
    );


  let offset =
    0;


  combined.set(
    start,
    offset
  );

  offset +=
    start.length;


  combined.set(
    metadataBytes,
    offset
  );

  offset +=
    metadataBytes.length;


  combined.set(
    middle,
    offset
  );

  offset +=
    middle.length;


  combined.set(
    videoBytes,
    offset
  );

  offset +=
    videoBytes.length;


  combined.set(
    end,
    offset
  );


  return combined;

}


/* =========================================================
   UPDATE PLATFORM POST
========================================================= */

async function updatePost(
  postId: string,
  values:
    Record<
      string,
      unknown
    >
) {

  const {
    error
  } =
    await supabase
      .from(
        "social_media_posts"
      )
      .update(
        values
      )
      .eq(
        "id",
        postId
      );


  if (
    error
  ) {

    throw new Error(
      `Could not update social post: ${error.message}`
    );

  }

}


/* =========================================================
   UPDATE OVERALL SUBMISSION STATUS
========================================================= */

async function updateSubmissionStatus(
  submissionId: string
) {

  const {
    data: posts,
    error
  } =
    await supabase
      .from(
        "social_media_posts"
      )
      .select(
        "status"
      )
      .eq(
        "submission_id",
        submissionId
      );


  if (
    error
  ) {

    console.warn(
      "Could not read platform statuses:",
      error
    );

    return;

  }


  const statuses =
    (
      posts ||
      []
    )
      .map(
        row =>
          row.status
      );


  if (
    !statuses.length
  ) {

    return;

  }


  let overallStatus =
    "approved";


  /* =======================================================
     ALL PUBLISHED
  ======================================================== */

  if (
    statuses.every(
      status =>
        status ===
        "published"
    )
  ) {

    overallStatus =
      "published";

  }


  /* =======================================================
     SOMETHING PUBLISHING
  ======================================================== */

  else if (
    statuses.some(
      status =>
        status ===
        "publishing"
    )
  ) {

    overallStatus =
      "publishing";

  }


  /* =======================================================
     ALL FAILED
  ======================================================== */

  else if (
    statuses.every(
      status =>
        status ===
        "failed"
    )
  ) {

    overallStatus =
      "failed";

  }


  /* =======================================================
     OTHERWISE APPROVED / QUEUED
  ======================================================== */

  else {

    overallStatus =
      "approved";

  }


  const payload:
    Record<
      string,
      unknown
    > = {

      status:
        overallStatus,

      updated_at:
        new Date()
          .toISOString()

    };


  if (
    overallStatus ===
    "published"
  ) {

    payload.published_at =
      new Date()
        .toISOString();

  }


  const {
    error:
      updateError
  } =
    await supabase
      .from(
        "social_media_submissions"
      )
      .update(
        payload
      )
      .eq(
        "id",
        submissionId
      );


  if (
    updateError
  ) {

    console.warn(
      "Could not update submission status:",
      updateError
    );

  }

}


/* =========================================================
   URL HELPER
========================================================= */

function isHttpUrl(
  value: string
) {

  try {

    const parsed =
      new URL(
        value
      );


    return (
      parsed.protocol ===
        "https:" ||
      parsed.protocol ===
        "http:"
    );

  }
  catch {

    return false;

  }

}


/* =========================================================
   JSON RESPONSE

   IMPORTANT:
   Every response includes CORS headers.
========================================================= */

function jsonResponse(
  data: unknown,
  status =
    200
) {

  return new Response(
    JSON.stringify(
      data
    ),
    {

      status,

      headers: {

        ...corsHeaders,

        "Content-Type":
          "application/json"

      }

    }
  );

}