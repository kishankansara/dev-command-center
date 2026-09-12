package com.devcommandcenter.model

import kotlinx.serialization.Serializable

@Serializable
data class DeploymentService(
    val id: String,
    val category: String,
    val customCategoryName: String? = null,
    val provider: String,
    val accountEmail: String,
    val consoleUrl: String? = null,
    val liveUrl: String? = null,
    val notes: String? = null,
    val linkedAccountId: String? = null
)
